import { NextRequest, NextResponse } from "next/server";
import { takeScreenshots } from "@/lib/screenshot";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, entityId } = body as {
      urls: { url: string; label: string }[];
      entityId: string;
    };

    if (!urls?.length || !entityId) {
      return NextResponse.json({ error: "Missing urls or entityId" }, { status: 400 });
    }

    console.log(`[Screenshot] Taking ${urls.length} screenshots for entity ${entityId}`);

    const results = await takeScreenshots(urls, entityId);

    const successCount = results.filter((r) => r.screenshotUrl).length;
    console.log(`[Screenshot] Done: ${successCount}/${results.length} successful`);

    return NextResponse.json({ screenshots: results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Screenshot] FAILED:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
