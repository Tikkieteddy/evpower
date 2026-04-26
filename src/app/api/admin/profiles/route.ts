import { NextResponse } from "next/server";
import { deleteProfilesByQueues, getAllProfiles } from "@/lib/google";
import { deleteMockProfilesByQueues, getMockProfiles, isMockGoogleEnabled } from "@/lib/mockData";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get("authorization") ?? "";
  return Boolean(password) && header === `Bearer ${password}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    if (isMockGoogleEnabled()) {
      return NextResponse.json({ records: getMockProfiles() });
    }

    const profiles = await getAllProfiles();
    return NextResponse.json({ records: profiles.map(({ record }) => record).reverse() });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load profiles." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { queues?: string[] };
    const queues = Array.isArray(body.queues) ? body.queues : [];

    if (queues.length === 0) {
      return NextResponse.json({ message: "Please select at least one record." }, { status: 400 });
    }

    const deletedQueues = isMockGoogleEnabled()
      ? deleteMockProfilesByQueues(queues)
      : await deleteProfilesByQueues(queues);

    return NextResponse.json({
      deletedQueues,
      message: `Deleted ${deletedQueues.length} record(s).`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete profiles." },
      { status: 500 },
    );
  }
}
