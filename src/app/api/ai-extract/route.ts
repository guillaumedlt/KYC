import { NextRequest, NextResponse } from "next/server";
import { extractIdentity, extractAddress, extractFundsSource, extractCompanyDocument, classifyDocument } from "@/lib/ai/claude";

export const maxDuration = 60; // Allow up to 60s for AI processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, base64, mediaType, docType, fileName, clientContext } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    console.log(`[AI Extract API] action=${action}, base64 length=${base64?.length ?? 0}, mediaType=${mediaType}`);

    let result;

    switch (action) {
      case "classify":
        // Classify by analyzing the document content (vision), not just filename
        result = await classifyDocument(fileName ?? "document", undefined, base64, mediaType);
        break;
      case "identity":
        if (!base64) return NextResponse.json({ error: "Missing base64" }, { status: 400 });
        result = await extractIdentity(base64, mediaType);
        break;
      case "address":
        if (!base64) return NextResponse.json({ error: "Missing base64" }, { status: 400 });
        result = await extractAddress(base64, mediaType, clientContext);
        break;
      case "funds":
        if (!base64) return NextResponse.json({ error: "Missing base64" }, { status: 400 });
        result = await extractFundsSource(base64, mediaType, clientContext);
        break;
      case "company":
        if (!base64) return NextResponse.json({ error: "Missing base64" }, { status: 400 });
        result = await extractCompanyDocument(base64, docType ?? "registration", clientContext);
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
