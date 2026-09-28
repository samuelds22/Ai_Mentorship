import { GoogleGenAI } from "@google/genai";

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function groundedAnswer(
  question: string,
  context: string,
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.",
    );
  }

  const prompt = `You are a document Q&A helper.
Use ONLY the document context below. Do not use outside knowledge.
If the context does not contain the answer, say exactly:
"I cannot find the answer in the provided document."

DOCUMENT:
${context.slice(0, 80000)}

QUESTION:
${question}`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return response.text?.trim() || "No response generated.";
}
