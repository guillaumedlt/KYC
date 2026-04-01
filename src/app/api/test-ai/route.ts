import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set", envKeys: Object.keys(process.env).filter(k => k.includes("ANTHROPIC") || k.includes("SUPABASE")).sort() });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const r = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [{ role: "user", content: 'Say {"ok":true}' }],
    });
    return NextResponse.json({
      ok: true,
      keyPrefix: key.slice(0, 15) + "...",
      response: r.content[0],
      tokens: r.usage,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : String(e),
      keyPrefix: key.slice(0, 15) + "...",
    });
  }
}
