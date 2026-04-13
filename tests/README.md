# learnEnglish — Acceptance Test Suite

Executable specification for the MVP. These tests are the **definition of done**:
when all green, the feature is complete.

## Philosophy — TDD Red / Green / Refactor

1. **Red** — These tests are written FIRST and must fail (modules don't exist yet).
2. **Green** — Implement the minimum production code to turn each test green.
3. **Refactor** — Clean up once green; tests guarantee no regression.

Do NOT modify tests to fit a broken implementation. If a test is wrong, fix it
explicitly in a dedicated commit with justification.

## Stack under test

Next.js 15 (App Router) · TypeScript · tRPC · Prisma · PostgreSQL · Auth.js v5 ·
Tailwind · shadcn/ui · ts-fsrs · edge-tts · Vercel AI SDK (multi-LLM BYOK) ·
MinIO.

## Structure

```
tests/
├── README.md                  ← you are here
├── unit/                      ← pure functions, no I/O (Vitest)
│   ├── srs.test.ts            ← FSRS scheduler
│   ├── llm-router.test.ts     ← multi-provider fallback
│   ├── epub-parser.test.ts    ← EPUB → chapters
│   ├── cefr-scorer.test.ts    ← placement test scoring
│   └── familiarity-tracker.test.ts ← word familiarity state machine
├── integration/               ← tRPC + DB + auth (Vitest + test DB)
│   ├── auth.test.ts
│   ├── trpc.flashcards.test.ts
│   ├── trpc.reading.test.ts
│   ├── trpc.settings.test.ts  ← BYOK crypto
│   └── trpc.export.test.ts
├── e2e/                       ← full browser flows (Playwright + MSW)
│   ├── signup-wizard.spec.ts
│   ├── flashcard-review-session.spec.ts
│   ├── reading-session.spec.ts
│   ├── settings-api-keys.spec.ts
│   └── fallback-llm.spec.ts
├── fixtures/
│   ├── epubs/                 ← sample EPUB binaries / manifests
│   ├── cefr/                  ← placement text samples A1..C2
│   └── llm-responses/         ← JSON mocks for Claude/Gemini/OpenAI/OpenRouter
└── helpers/                   ← test utilities (db reset, msw server, factories)
```

## Running

```bash
npm install

# Start a disposable PostgreSQL for integration tests:
docker compose up db -d

# Apply the schema to the test DB:
DATABASE_URL=postgres://learnenglish:learnenglish@localhost:5433/learnenglish \
  npx prisma migrate dev --name init

npm run test:unit         # fast, no server needed
npm run test:integration  # needs DATABASE_URL pointing at a disposable PG
npm run test:e2e          # spins up dev server
npm run test:watch        # TDD loop
```

### Required env for integration/e2e

```
DATABASE_URL=postgres://learnenglish:learnenglish@localhost:5433/learnenglish
AUTH_SECRET=testsecret
# 32-byte key (base64 or 64-char hex) used by src/lib/crypto/byok.ts
BYOK_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=
```

## Conventions

- Test names in English: `it('should ...')`.
- **AAA**: Arrange / Act / Assert — blank lines between blocks.
- One logical assertion per test (multiple `expect` calls OK if same assertion).
- Fixtures immutable; never mutate across tests.
- LLM calls MUST go through MSW — no real network.

## Consciously out of scope (not covered by this suite)

- Visual regression / pixel diffs (Chromatic/Percy).
- Performance budgets (Lighthouse CI).
- Push notifications / background sync PWA behavior.
- Accessibility audit beyond basic role queries (axe-core).
- Load testing the LLM router under concurrency.
- Edge-TTS actual audio byte-level validation (we mock to fixture).
- Real OAuth round-trip with Google (stubbed at Auth.js boundary).
