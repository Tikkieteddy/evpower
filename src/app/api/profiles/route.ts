import { NextResponse } from "next/server";
import { createSupervisorApprovalUrl } from "@/lib/approval";
import {
  appendProfile,
  createQueueNumber,
  findProfileByQueue,
  updateProfilePictureUrl,
  uploadImageToDrive,
} from "@/lib/google";
import { getBangkokDateParts, nowIso } from "@/lib/date";
import { appendMockProfile, getMockProfiles, isMockGoogleEnabled } from "@/lib/mockData";
import { sendSupervisorApprovalEmail } from "@/lib/email";
import { validateImageFile, validateProfile } from "@/lib/validation";
import type { ProfileRecord, SubmitProfileInput } from "@/lib/types";

export const runtime = "nodejs";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function boolean(formData: FormData, key: string) {
  return String(formData.get(key) ?? "") === "true";
}

function textList(formData: FormData, key: string) {
  const values = formData.getAll(key).map((value) => String(value).trim()).filter(Boolean);
  if (values.length > 1) return values;
  return values.flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function confirmAdminRecordSaved(queue: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const found = await findProfileByQueue(queue);
    if (found?.record) return found.record;
    await delay(500 * (attempt + 1));
  }
  throw new Error("บันทึกข้อมูลเข้า admin ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    const input: SubmitProfileInput = {
      userAccess: text(formData, "userAccess") as SubmitProfileInput["userAccess"],
      thaiFirstName: text(formData, "thaiFirstName"),
      thaiLastName: text(formData, "thaiLastName"),
      englishFirstName: text(formData, "englishFirstName"),
      englishLastName: text(formData, "englishLastName"),
      nickname: text(formData, "nickname"),
      organizationEmail: text(formData, "organizationEmail"),
      personalEmail: text(formData, "personalEmail"),
      creatorTypes: textList(formData, "creatorTypes") as SubmitProfileInput["creatorTypes"],
      newscasterProgram: text(formData, "newscasterProgram"),
      facebook: text(formData, "facebook"),
      instagram: text(formData, "instagram"),
      tiktok: text(formData, "tiktok"),
      x: text(formData, "x"),
      profile: text(formData, "profile"),
      team: text(formData, "team"),
      supervisorEmail: text(formData, "supervisorEmail"),
      isNonStaff: boolean(formData, "isNonStaff"),
    };

    const errors = validateProfile(input);
    const fileError = validateImageFile(image instanceof File ? image : null);
    if (fileError) errors.image = fileError;

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: "Validation failed.", errors }, { status: 400 });
    }

    const queue = isMockGoogleEnabled() ? createMockQueueNumber() : await createQueueNumber();
    const submittedAt = nowIso();
    let record: ProfileRecord = {
      queue,
      ...input,
      pictureUrl: isMockGoogleEnabled() ? "https://placehold.co/600x600/png" : "",
      status: "Upload" as const,
      listStatus: "Active" as const,
      submittedAt,
      completedAt: "",
      lastUpdatedAt: submittedAt,
      statusLog: `${submittedAt}: Upload`,
      supervisorApprovedAt: "",
    };
    let adminRecord: { saved: boolean; message?: string } = { saved: false };

    if (!isMockGoogleEnabled()) {
      await appendProfile(record);
      record = await confirmAdminRecordSaved(queue);
      adminRecord = { saved: true };
    } else {
      appendMockProfile(record);
      adminRecord = { saved: true };
    }

    let imageUpload: { uploaded: boolean; message?: string } = { uploaded: Boolean(record.pictureUrl) };
    if (!isMockGoogleEnabled()) {
      try {
        const pictureUrl = await uploadImageToDrive(image as File, queue);
        record = (await updateProfilePictureUrl(queue, pictureUrl)) ?? { ...record, pictureUrl };
        imageUpload = { uploaded: true };
      } catch (error) {
        console.error("Profile image upload failed after admin save:", error);
        imageUpload = {
          uploaded: false,
          message: error instanceof Error ? error.message : "Unable to upload profile image.",
        };
      }
    }

    let supervisorEmail: { sent: boolean; message?: string } | null = null;
    if (record.supervisorEmail) {
      const approvalUrl = createSupervisorApprovalUrl(new URL(request.url).origin, queue);
      try {
        await sendSupervisorApprovalEmail(record, approvalUrl);
        supervisorEmail = { sent: true };
      } catch (error) {
        console.error("Supervisor approval email failed:", error);
        supervisorEmail = {
          sent: false,
          message: error instanceof Error ? error.message : "Unable to send supervisor approval email.",
        };
      }
    }

    return NextResponse.json({
      message: "Profile submitted successfully.",
      record,
      adminRecord,
      imageUpload,
      supervisorEmail,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Submit failed." },
      { status: 500 },
    );
  }
}

function createMockQueueNumber() {
  const { day, month, year } = getBangkokDateParts();
  const suffix = `${day}-${month}-${year}`;
  const todayNumbers = getMockProfiles()
    .map((record) => record.queue)
    .filter((queue) => queue.endsWith(suffix))
    .map((queue) => Number.parseInt(queue.split("-")[0] ?? "0", 10))
    .filter(Number.isFinite);
  const nextNumber = todayNumbers.length > 0 ? Math.max(...todayNumbers) + 1 : 1;
  const number = String(nextNumber).padStart(2, "0");
  return `${number}-${day}-${month}-${year}`;
}
