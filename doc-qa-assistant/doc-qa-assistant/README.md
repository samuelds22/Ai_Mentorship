# Doc Q&A Assistant

Upload a PDF, TXT, or Markdown file, search inside it with in-memory TF-IDF, and ask questions answered only from the document (Google Gemini).

## Features

- Parse `.pdf`, `.txt`, `.md`
- In-memory TF-IDF + cosine similarity search (no vector DB)
- Grounded Q&A with Gemini — answers only from uploaded text
- Next.js App Router + Tailwind CSS + TypeScript

## Setup

```bash
cd doc-qa-assistant
npm install
cp .env.example .env.local
# put your Gemini API key in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/parse` | POST (multipart) | Extract text + paragraphs |
| `/api/search` | POST (JSON) | Rank paragraphs by query |
| `/api/chat` | POST (JSON) | Grounded answer from context |

## Environment

```
GEMINI_API_KEY=...
```

Without a key, parse and search still work; chat will return an error until the key is set.
