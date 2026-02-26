# Familiar

AI-powered D&D 5e encounter assistant for dungeon masters. Chat with an AI that knows the SRD rules and helps you design creative, balanced encounters.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Get a free API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and add it to `.env.local`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
   ```

3. Run the dev server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## SRD Content

The `srd/` directory contains markdown files with D&D 5e SRD reference material. These are loaded into a Gemini context cache so the AI can reference rules accurately without paying full input token cost on every message. Add more `.md` files to this directory to expand the AI's knowledge base.

## Stack

- Next.js + TypeScript
- Google Gemini API (Gemini 2.5 Flash) with context caching
- Tailwind CSS
