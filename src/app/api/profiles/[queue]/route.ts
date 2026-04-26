import { NextResponse } from "next/server";
import { findProfileByQueue, updateProfileDetails, uploadImageToDrive } from "@/lib/google";
import { findMockProfile, isMockGoogleEnabled, updateMockProfileDetails } from "@/lib/mockData";
import { validateImageFile, validateProfile } from "@/lib/validation";
import type { SubmitProfileInput } from "@/lib/types";

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

function formToInput(formData: FormData): SubmitProfileInput {
  return {
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
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ queue: string }> },
) {
  try {
    const { queue } = await context.params;
    const decodedQueue = decodeURIComponent(queue);
    const record = isMockGoogleEnabled()
      ? findMockProfile(decodedQueue)
      : (await findProfileByQueue(decodedQueue))?.record;

    if (!record) {
      return NextResponse.json({ message: "Queue not found." }, { status: 404 });
    }

    return NextResponse.json({ record, canEdit: record.status === "Upload" || record.status === "Verify" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load profile." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ queue: string }> },
) {
  try {
    const { queue } = await context.params;
    const decodedQueue = decodeURIComponent(queue);
    const formData = await request.formData();
    const image = formData.get("image");
    const input = formToInput(formData);
    const errors = validateProfile(input);

    if (image instanceof File && image.size > 0) {
      const fileError = validateImageFile(image);
      if (fileError) errors.image = fileError;
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: "Validation failed.", errors }, { status: 400 });
    }

    if (isMockGoogleEnabled()) {
      const current = findMockProfile(decodedQueue);
      if (!current) {
        return NextResponse.json({ message: "Queue not found." }, { status: 404 });
      }
      if (current.status !== "Upload" && current.status !== "Verify") {
        return NextResponse.json(
          { message: "This profile can no longer be edited after admin starts processing." },
          { status: 409 },
        );
      }
      const record = updateMockProfileDetails(decodedQueue, input);
      return NextResponse.json({
        record,
      });
    }

    const pictureUrl =
      image instanceof File && image.size > 0
        ? await uploadImageToDrive(image, decodedQueue)
        : undefined;
    const record = await updateProfileDetails(decodedQueue, input, pictureUrl);
    if (!record) {
      return NextResponse.json({ message: "Queue not found." }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update profile." },
      { status: 500 },
    );
  }
}
