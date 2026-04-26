import { NextResponse } from "next/server";
import { isSupervisorApprovalTokenValid } from "@/lib/approval";
import { approveProfileBySupervisor, denyProfileBySupervisor } from "@/lib/google";
import { approveMockProfileBySupervisor, denyMockProfileBySupervisor, isMockGoogleEnabled } from "@/lib/mockData";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ queue: string }> },
) {
  try {
    const { queue } = await context.params;
    const decodedQueue = decodeURIComponent(queue);
    const body = (await request.json()) as { token?: string; action?: "approve" | "deny" };
    const token = body.token?.trim() ?? "";
    const action = body.action === "deny" ? "deny" : "approve";

    if (!isSupervisorApprovalTokenValid(decodedQueue, token)) {
      return NextResponse.json({ message: "Invalid approval link." }, { status: 401 });
    }

    const record = isMockGoogleEnabled()
      ? action === "deny"
        ? denyMockProfileBySupervisor(decodedQueue)
        : approveMockProfileBySupervisor(decodedQueue)
      : action === "deny"
        ? await denyProfileBySupervisor(decodedQueue)
        : await approveProfileBySupervisor(decodedQueue);

    if (!record) {
      return NextResponse.json({ message: "Queue not found." }, { status: 404 });
    }

    return NextResponse.json({ action, record });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to submit supervisor decision." },
      { status: 500 },
    );
  }
}
