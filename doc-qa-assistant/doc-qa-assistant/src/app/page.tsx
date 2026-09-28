"use client";

import { useMemo, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";

type SearchHit = { text: string; score: number; index: number };
type ChatTurn = { role: "user" | "assistant"; text: string };

type DocState = {
  fileName: string;
  fullText: string;
  paragraphs: string[];
  totalCharacters: number;
};

export default function Home() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<DocState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);

  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatTurn[]>([]);

  const stats = useMemo(() => {
    if (!doc) return null;
    return `${doc.paragraphs.length} chunks · ${doc.totalCharacters.toLocaleString()} chars`;
  }, [doc]);

  async function onFile(file: File) {
    setError(null);
    setHits([]);
    setChat([]);
    setBusy("Reading document…");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setDoc({
        fileName: data.fileName,
        fullText: data.fullText,
        paragraphs: data.paragraphs,
        totalCharacters: data.totalCharacters,
      });
    } catch (e: unknown) {
      setDoc(null);
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function runSearch() {
    if (!doc || !query.trim()) return;
    setError(null);
    setBusy("Searching…");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          paragraphs: doc.paragraphs,
          topK: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setHits(data.results || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(null);
    }
  }

  async function runChat() {
    if (!doc || !question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setChat((c) => [...c, { role: "user", text: q }]);
    setError(null);
    setBusy("Thinking…");
    try {
      // Prefer top search hits as context when available; else full doc
      const context =
        hits.length > 0
          ? hits.map((h) => h.text).join("\n\n")
          : doc.fullText;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setChat((c) => [...c, { role: "assistant", text: data.answer }]);
    } catch (e: unknown) {
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: e instanceof Error ? e.message : "Chat failed",
        },
      ]);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="mb-8">
        <p className="mb-1 text-sm tracking-wide text-[var(--accent)] uppercase">
          Document intelligence
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Doc Q&A Assistant</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Upload a PDF or text file, search chunks with TF-IDF, and ask questions
          answered only from the document.
        </p>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      {/* Upload */}
      <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4 text-[var(--accent)]" />
            Document
          </div>
          {doc ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--text)]"
              onClick={() => {
                setDoc(null);
                setHits([]);
                setChat([]);
              }}
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          ) : null}
        </div>

        {!doc ? (
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--panel-2)] px-4 py-10 text-center transition hover:border-[var(--accent)]">
            <FileText className="mb-2 h-8 w-8 text-[var(--muted)]" />
            <span className="text-sm">Drop or click to upload PDF / TXT / MD</span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>
        ) : (
          <div className="mt-4 rounded-lg bg-[var(--panel-2)] px-4 py-3 text-sm">
            <p className="font-medium">{doc.fileName}</p>
            <p className="mt-1 text-[var(--muted)]">{stats}</p>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Search className="h-4 w-4 text-[var(--accent)]" />
            Semantic search
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runSearch()}
              disabled={!doc || !!busy}
              placeholder={doc ? "Search inside the document…" : "Upload a file first"}
              className="min-h-11 flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              disabled={!doc || !query.trim() || !!busy}
              onClick={() => void runSearch()}
              className="min-h-11 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[#041018] disabled:opacity-40"
            >
              Search
            </button>
          </div>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {hits.map((h) => (
              <li
                key={h.index}
                className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3 text-sm"
              >
                <p className="mb-1 font-mono text-xs text-[var(--ok)]">
                  score {h.score} · chunk #{h.index}
                </p>
                <p className="leading-relaxed text-[var(--muted)]">
                  {h.text.slice(0, 320)}
                  {h.text.length > 320 ? "…" : ""}
                </p>
              </li>
            ))}
            {!hits.length ? (
              <li className="text-sm text-[var(--muted)]">No results yet.</li>
            ) : null}
          </ul>
        </section>

        {/* Chat */}
        <section className="flex min-h-[28rem] flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
            Grounded Q&amp;A
          </div>
          <div className="mb-3 flex-1 space-y-3 overflow-y-auto">
            {chat.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Ask a question. Answers use document text only
                {hits.length ? " (preferring current search hits as context)" : ""}.
              </p>
            ) : (
              chat.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-lg bg-[var(--accent-dim)]/40 px-3 py-2 text-sm"
                      : "mr-8 rounded-lg bg-[var(--panel-2)] px-3 py-2 text-sm leading-relaxed"
                  }
                >
                  {m.text}
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runChat()}
              disabled={!doc || !!busy}
              placeholder={doc ? "Ask about this document…" : "Upload a file first"}
              className="min-h-11 flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              disabled={!doc || !question.trim() || !!busy}
              onClick={() => void runChat()}
              className="grid min-h-11 min-w-11 place-items-center rounded-lg bg-[var(--accent)] text-[#041018] disabled:opacity-40"
              aria-label="Send"
            >
              {busy === "Thinking…" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </section>
      </div>

      {busy ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> {busy}
        </p>
      ) : null}
    </main>
  );
}
