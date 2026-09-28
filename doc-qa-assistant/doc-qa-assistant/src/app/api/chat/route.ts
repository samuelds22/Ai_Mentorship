import { NextRequest, NextResponse } from "next/server";
import { groundedAnswer } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "question is required." }, { status: 400 });
    }
    if (typeof context !== "string" || !context.trim()) {
      return NextResponse.json({ error: "context is required." }, { status: 400 });
    }

    const answer = await groundedAnswer(question.trim(), context);

    return NextResponse.json({ success: true, answer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
