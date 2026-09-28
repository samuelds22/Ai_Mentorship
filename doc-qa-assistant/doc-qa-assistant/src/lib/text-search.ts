/** Simple in-memory TF-IDF + cosine similarity (no external vector DB). */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function buildTfIdfVectors(texts: string[]): number[][] {
  const docs = texts.map(tokenize);
  const vocab = Array.from(new Set(docs.flat()));
  if (vocab.length === 0) return texts.map(() => []);

  const n = docs.length;
  const idf = new Map<string, number>();
  for (const term of vocab) {
    const df = docs.filter((d) => d.includes(term)).length;
    idf.set(term, Math.log((n + 1) / (df + 1)) + 1);
  }

  return docs.map((doc) => {
    const counts = new Map<string, number>();
    for (const t of doc) counts.set(t, (counts.get(t) || 0) + 1);
    const len = doc.length || 1;
    return vocab.map((term) => {
      const tf = (counts.get(term) || 0) / len;
      return tf * (idf.get(term) || 0);
    });
  });
}

export function rankParagraphs(
  query: string,
  paragraphs: string[],
  topK = 5,
): { text: string; score: number; index: number }[] {
  const vectors = buildTfIdfVectors([query, ...paragraphs]);
  const q = vectors[0];
  const scored = paragraphs.map((text, index) => ({
    text,
    index,
    score: Math.round(cosineSimilarity(q, vectors[index + 1]) * 1000) / 1000,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function chunkDocument(fullText: string): string[] {
  const parts = fullText
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 30);
  return parts.length > 0 ? parts : [fullText.trim()].filter(Boolean);
}
