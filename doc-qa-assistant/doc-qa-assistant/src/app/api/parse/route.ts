import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { chunkDocument } from "@/lib/text-search";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload." }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
    const isText =
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      file.type.startsWith("text/") ||
      ALLOWED.has(file.type);

    if (!isPdf && !isText) {
      return NextResponse.json(
        { error: "Upload a .pdf, .txt, or .md file." },
        { status: 400 },
      );
    }

    let fullText = "";
    if (isPdf) {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const result = await extractText(buffer);
      fullText = Array.isArray(result.text) ? result.text.join("\n") : String(result.text || "");
    } else {
      fullText = await file.text();
    }

    fullText = fullText.replace(/\r\n/g, "\n").trim();
    if (!fullText) {
      return NextResponse.json(
        { error: "Could not extract text from this file." },
        { status: 422 },
      );
    }

    const paragraphs = chunkDocument(fullText);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalCharacters: fullText.length,
      paragraphsCount: paragraphs.length,
      fullText,
      paragraphs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
