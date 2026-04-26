import { NextResponse } from "next/server";
import { findProfileByQueue } from "@/lib/google";
import { getMockProfiles, isMockGoogleEnabled } from "@/lib/mockData";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get("authorization") ?? "";
  return Boolean(password) && header === `Bearer ${password}`;
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function GET(
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
      ? getMockProfiles().find((profile) => profile.queue === decodedQueue)
      : (await findProfileByQueue(decodedQueue))?.record;

    if (!record?.pictureUrl) {
      return NextResponse.json({ message: "Image not found." }, { status: 404 });
    }

    const response = await fetch(record.pictureUrl);
    if (!response.ok) {
      return NextResponse.json({ message: "Unable to download image." }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const bytes = await response.arrayBuffer();
    const extension = extensionFromContentType(contentType);

    return new Response(bytes, {
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${record.queue}.${extension}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to download image." },
      { status: 500 },
    );
  }
}
