import { NextResponse } from "next/server";
import { updateProfileListStatus, updateProfileStatus } from "@/lib/google";
import { sendStatusUpdateEmail } from "@/lib/email";
import { isMockGoogleEnabled, updateMockProfileListStatus, updateMockProfileStatus } from "@/lib/mockData";
import { LIST_STATUSES, STATUSES, type ListStatus, type ProfileStatus } from "@/lib/types";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get("authorization") ?? "";
  return Boolean(password) && header === `Bearer ${password}`;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ queue: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { queue } = await context.params;
    const body = (await request.json()) as {
      listStatus?: ListStatus;
      note?: string;
      status?: ProfileStatus;
    };

    if (body.listStatus) {
      if (!LIST_STATUSES.includes(body.listStatus)) {
        return NextResponse.json({ message: "Invalid list status." }, { status: 400 });
      }
      const record = isMockGoogleEnabled()
        ? updateMockProfileListStatus(decodeURIComponent(queue), body.listStatus)
        : await updateProfileListStatus(decodeURIComponent(queue), body.listStatus);
      if (!record) {
        return NextResponse.json({ message: "Queue not found." }, { status: 404 });
      }
      return NextResponse.json({ record, email: { sent: false } });
    }

    if (!body.status || !STATUSES.includes(body.status)) {
      return NextResponse.json({ message: "Invalid status." }, { status: 400 });
    }

    const note = body.note?.trim() ?? "";
    if (!note) {
      return NextResponse.json({ message: "กรุณากรอกข้อความก่อนปรับ status และส่งอีเมล" }, { status: 400 });
    }

    if (isMockGoogleEnabled()) {
      const record = updateMockProfileStatus(decodeURIComponent(queue), body.status, note);
      if (!record) {
        return NextResponse.json({ message: "Queue not found." }, { status: 404 });
      }
      try {
        await sendStatusUpdateEmail(record, body.status, note);
        return NextResponse.json({ record, email: { sent: true } });
      } catch (error) {
        console.error("Status update email failed:", error);
        return NextResponse.json({
          record,
          email: {
            sent: false,
            message: error instanceof Error ? error.message : "Unable to send status update email.",
          },
        });
      }
    }

    const record = await updateProfileStatus(decodeURIComponent(queue), body.status, note);
    if (!record) {
      return NextResponse.json({ message: "Queue not found." }, { status: 404 });
    }
    try {
      await sendStatusUpdateEmail(record, body.status, note);
      return NextResponse.json({ record, email: { sent: true } });
    } catch (error) {
      console.error("Status update email failed:", error);
      return NextResponse.json({
        record,
        email: {
          sent: false,
          message: error instanceof Error ? error.message : "Unable to send status update email.",
        },
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update profile." },
      { status: 500 },
    );
  }
}
