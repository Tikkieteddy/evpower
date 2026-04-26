import { NextResponse } from "next/server";
import { findProfileByQueue } from "@/lib/google";
import { findMockProfile, isMockGoogleEnabled } from "@/lib/mockData";

export const runtime = "nodejs";

function getLatestVerifyNote(statusLog: string) {
  const notePattern = /(?:^|\n)[^\n]*:\s*Verify\s*\(([\s\S]*?)\)(?=\n[^\n]*:\s*(?:Upload|Verify|In progress|Completed|User edited profile)|$)/g;
  const matches = [...statusLog.matchAll(notePattern)];
  return matches.at(-1)?.[1]?.trim() ?? "";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ queue: string }> },
) {
  try {
    const { queue } = await context.params;

    if (isMockGoogleEnabled()) {
      const record = findMockProfile(decodeURIComponent(queue));

      if (!record) {
        return NextResponse.json({ message: "Queue not found." }, { status: 404 });
      }

      return NextResponse.json({
        record: {
          queue: record.queue,
          thaiFirstName: record.thaiFirstName,
          thaiLastName: record.thaiLastName,
          status: record.status,
          submittedAt: record.submittedAt,
          completedAt: record.completedAt,
          canEdit: record.status === "Upload" || record.status === "Verify",
          verifyNote: getLatestVerifyNote(record.statusLog),
        },
      });
    }

    const found = await findProfileByQueue(decodeURIComponent(queue));

    if (!found) {
      return NextResponse.json({ message: "Queue not found." }, { status: 404 });
    }

    const { record } = found;
    return NextResponse.json({
      record: {
        queue: record.queue,
        thaiFirstName: record.thaiFirstName,
        thaiLastName: record.thaiLastName,
        status: record.status,
        submittedAt: record.submittedAt,
        completedAt: record.completedAt,
        canEdit: record.status === "Upload" || record.status === "Verify",
        verifyNote: getLatestVerifyNote(record.statusLog),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Track failed." },
      { status: 500 },
    );
  }
}
