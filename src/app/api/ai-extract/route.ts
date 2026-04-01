import { NextRequest, NextResponse } from "next/server";
import { extractIdentity, extractAddress, extractFundsSource, extractCompanyDocument } from "@/lib/ai/claude";

export const maxDuration = 60; // Allow up to 60s for AI processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, base64, mediaType, docType } = body;

    if (!base64 || !action) {
      return NextResponse.json({ error: "Missing base64 or action" }, { status: 400 });
    }

    console.log(`[AI Extract API] action=${action}, base64 length=${base64.length}, mediaType=${mediaType}`);

    let result;

    switch (action) {
      case "identity":
        result = await extractIdentity(base64, mediaType);
        break;
      case "address":
        result = await extractAddress(base64, mediaType);
        break;
      case "funds":
        result = await extractFundsSource(base64, mediaType);
        break;
      case "company":
        result = await extractCompanyDocument(base64, docType ?? "registration");
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    console.log(`[AI Extract API] Success, confidence: ${(result as { confidence?: number })?.confidence ?? "N/A"}`);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[AI Extract API] FAILED:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
