import { NextRequest, NextResponse } from "next/server";
import { rankParagraphs } from "@/lib/text-search";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query;
    const paragraphs = body?.paragraphs;
    const topK = Number(body?.topK ?? 5);

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "query is required." }, { status: 400 });
    }
    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      return NextResponse.json(
        { error: "paragraphs must be a non-empty array." },
        { status: 400 },
      );
    }

    const results = rankParagraphs(
      query,
      paragraphs.map(String),
      Math.min(Math.max(topK, 1), 20),
    );

    return NextResponse.json({ success: true, query, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
