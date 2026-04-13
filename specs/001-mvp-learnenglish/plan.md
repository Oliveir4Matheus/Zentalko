# Plan 001 — MVP learnEnglish

> **COMO** a spec vira código. Decisões arquiteturais, stack, fases.
> Mudanças significativas de arquitetura viram ADRs em `adr/`.

---

## 1. Arquitetura (subcontainers Coolify)

```
learnEnglish/
├── web          Next.js 15 (App Router) — UI + tRPC + Auth.js
├── db           Postgres 16
├── storage      MinIO (S3 compat) — áudios TTS, EPUBs
├── tts          FastAPI + edge-tts (Python)
└── migrations   job de init: prisma migrate deploy
```

Rede Docker interna; apenas `web` exposto. Volumes persistentes em `db` e
`storage`. Env vars sensíveis via Coolify.

## 2. Camadas lógicas dentro de `web`

```
src/
├── app/                 Next.js App Router (RSC por padrão)
│   ├── (auth)/          signup, login
│   ├── (onboarding)/    wizard passo-a-passo
│   ├── (app)/           dashboard, flashcards, reading, library, settings
│   └── api/
│       ├── auth/[...]/  Auth.js v5
│       └── trpc/[trpc]/ tRPC adapter
├── server/
│   ├── db.ts            prisma singleton
│   ├── auth.ts          signUp/signIn/getSession + Auth.js config
│   ├── trpc/
│   │   ├── context.ts   { userId, locale, prisma }
│   │   ├── router.ts    root router + createCaller
│   │   └── routers/     flashcards, reading, settings, export, stats
│   ├── llm/router.ts    multi-provider fallback  ✅ já implementado
│   ├── srs/index.ts     wrapper ts-fsrs           ✅ já implementado
│   ├── reading/
│   │   ├── epub-parser.ts    ✅ já implementado
│   │   └── familiarity.ts    ✅ já implementado
│   └── placement/cefr-scorer.ts ✅ já implementado
├── lib/
│   ├── crypto/          AES-256-GCM (BYOK)
│   ├── tts/             cliente HTTP do microserviço edge-tts
│   ├── storage/         cliente MinIO
│   └── i18n/            ✅ já implementado
├── components/
│   ├── ui/              shadcn primitives
│   ├── wizard/          steps do onboarding
│   ├── reader/          leitor (palavra clicável, karaokê)
│   └── flashcards/      review UI
└── messages/            next-intl (pt.json, en.json)
```

## 3. Decisões de stack (reafirmadas pela constitution §III)

| Decisão | Escolha | Alternativa considerada | Motivo |
|---|---|---|---|
| Framework | Next.js 15 | Remix | App Router + RSC + ecossistema |
| API | tRPC | REST + OpenAPI | Type-safety end-to-end, Zod nativo |
| ORM | Prisma | Drizzle | DX madura, migrations |
| Auth | Auth.js v5 | Lucia | Credentials + Google out-of-box |
| SRS | ts-fsrs | SM-2 próprio | FSRS tem melhor evidência |
| TTS | edge-tts via FastAPI | ElevenLabs paga | Zero custo, qualidade OK |
| LLM SDK | Vercel AI SDK | SDKs diretos | Streaming + multi-provider |
| Crypto | AES-256-GCM (Node crypto) | libsodium | Lib stdlib; suficiente |
| Storage | MinIO | AWS S3 | Self-hosted alinhado ao Coolify |
| i18n | next-intl | react-intl | Server Components friendly |
| Tests | Vitest + Playwright + MSW | Jest + Cypress | Performance + ESM |

## 4. Fluxos críticos

### 4.1 Wizard → dashboard
`middleware.ts` lê sessão; se `onboardingCompleted=false` e rota ≠ `/onboarding/*`
→ redirect `/onboarding/welcome`. Último passo chama
`settings.completeOnboarding` que valida: `cefrLevel != null`, `apiKeys.count ≥ 1`,
`dailyNewCardLimit > 0`; só então flipa `onboardingCompleted=true`.

### 4.2 Fallback LLM
`llm.router.callLLM(task, userId)` busca `ApiKey` do user ordenadas por
`priority`, decripta (AES-256-GCM), tenta provider 1. Em erro {network,
429, 401/403} → próximo. Se todos falharem → `LLMUnavailableError`. Já
coberto por unit tests.

### 4.3 BYOK CRUD
`settings.saveApiKey({provider, key})` → `encrypt(key, BYOK_ENCRYPTION_KEY)`
→ `prisma.apiKey.upsert`. `listApiKeys()` retorna `{provider, maskedKey,
priority, enabled}` — nunca o ciphertext bruto, nunca plaintext.

### 4.4 Review de flashcard
`flashcards.review({cardId, rating})` → lê `fsrsState` → `srs.schedule(state,
rating)` → escreve `ReviewLog` + atualiza `Flashcard` (novo `dueAt`,
`stability`, `difficulty`, `reps`, `state`) + `gamification.awardXp`.

### 4.5 Sessão de leitura
`reading.startSession({chapterId})` faz upsert por `(userId, chapterId,
endedAt=null)` — reabrir mesmo capítulo retorna sessão aberta.
`endSession({sessionId})` fecha e retorna `reviewableWords` (palavras com
familiaridade Learning/New dentro do capítulo).

## 5. Contratos tRPC (resumo)

| Router | Procedures |
|---|---|
| `flashcards` | `create`, `generateFromTopic`, `review`, `dueQueue`, `list` |
| `reading` | `createFromText`, `importEpub`, `library`, `startSession`, `endSession`, `translateWord`, `explainSentence`, `addWordAsFlashcard`, `setWordFamiliarity`, `getWordFamiliarity` |
| `settings` | `update`, `saveApiKey`, `listApiKeys`, `deleteApiKey`, `setProviderOrder`, `getProviderOrder`, `completeOnboarding` |
| `export` | `userData` |
| `stats` | `me`, `registerDailyActivity` |

Todos procedures autenticados; contexto = `{ userId, locale, prisma }`.

## 6. Fases de execução (ligam `tasks.md`)

1. **Fase A — Specs & testes** ✅ *concluído*: requisitos, schema Prisma,
   suite de testes, unit implementations.
2. **Fase B — Fundação backend**: deps, `@/server/db`, `@/lib/crypto`,
   `@/server/auth`, Auth.js config, migrations.
3. **Fase C — tRPC routers**: settings, flashcards, reading, stats,
   export — até `tests/integration/**` verde.
4. **Fase D — App Next.js**: rotas, middleware, layout, i18n, providers.
5. **Fase E — UI**: wizard, dashboard, review, reader (palavra clicável,
   cores de familiaridade, karaokê TTS), library, settings.
6. **Fase F — Serviços auxiliares**: FastAPI TTS (edge-tts), cliente
   MinIO, adapter TTS→Storage.
7. **Fase G — E2E verde**: playwright specs passando.
8. **Fase H — Hardening**: rate limit, sanitização, logs estruturados,
   smoke deploy no Coolify.

## 7. Testes como gate
Cada fase só é "done" quando os testes aplicáveis estão verdes
(`tests/unit` para A, `tests/integration` para B+C, `tests/e2e` para
D+E+F+G).

## 8. Riscos arquiteturais e mitigação
- **Prisma + App Router HMR** → singleton global guardado em `globalThis.__prisma`.
- **MSW em ambiente Node integração** → já configurado em `tests/helpers/setup.ts`.
- **edge-tts rate limit da Microsoft** → cachear áudios em MinIO por hash de
  `(text, voice)`.
- **Upload EPUB grande** → limitar a 20MB via route handler; parse em
  streaming onde possível.
