# Zentalko — learnEnglish

PWA de aprendizado de inglês para falantes de PT-BR, combinando **FSRS** (repetição espaçada),
**leitura extensiva** assistida e **IA multi-provider BYOK** (Claude / Gemini / OpenAI / OpenRouter).

## Stack

Next.js 15 · TypeScript · tRPC · Prisma · PostgreSQL · Auth.js v5 ·
Tailwind + shadcn/ui · ts-fsrs · Vercel AI SDK · MinIO · edge-tts (FastAPI)

## Quickstart

```bash
npm install
cp .env.example .env.local
docker compose up db -d
npx prisma migrate dev
npm run dev
```

## Testes

```bash
npm run test:unit          # 34/34
npm run test:integration   # 31/31 (precisa DB up)
npm run test:e2e           # Playwright
```

Detalhes em `tests/README.md` e `CLAUDE.md`.

## Status

MVP ~95% — ver `specs/001-mvp-learnenglish/tasks.md`.
