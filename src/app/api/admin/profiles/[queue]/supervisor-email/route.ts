import { NextResponse } from "next/server";
import { createSupervisorApprovalUrl } from "@/lib/approval";
import { sendSupervisorApprovalEmail } from "@/lib/email";
import { findProfileByQueue } from "@/lib/google";
import { findMockProfile, isMockGoogleEnabled } from "@/lib/mockData";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get("authorization") ?? "";
  return Boolean(password) && header === `Bearer ${password}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ queue: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { queue } = await context.params;
    const decodedQueue = decodeURIComponent(queue);
    const record = isMockGoogleEnabled()
      ? findMockProfile(decodedQueue)
      : (await findProfileByQueue(decodedQueue))?.record;

    if (!record) {
      return NextResponse.json({ message: "Queue not found." }, { status: 404 });
    }
    if (!record.supervisorEmail) {
      return NextResponse.json({ message: "This profile has no supervisor email." }, { status: 400 });
    }
    if (record.supervisorApprovedAt) {
      return NextResponse.json({ message: "Supervisor already approved this profile." }, { status: 400 });
    }

    const approvalUrl = createSupervisorApprovalUrl(new URL(request.url).origin, decodedQueue);
    await sendSupervisorApprovalEmail(record, approvalUrl);
    return NextResponse.json({ message: "Supervisor approval email sent." });
  } catch (error) {
    console.error("Supervisor approval email failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to send supervisor approval email." },
      { status: 500 },
    );
  }
}
