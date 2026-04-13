# learnEnglish — Prompt do Projeto

> Prompt mestre para o Claude Code construir o sistema. Use como contexto inicial de qualquer sessão de implementação.

---

## 1. Visão Geral

**learnEnglish** é uma plataforma web/mobile (PWA) de aprendizado de inglês para falantes nativos de português, baseada em três pilares cientificamente validados:

1. **Repetição espaçada** (flashcards com algoritmo FSRS)
2. **Leitura extensiva assistida** (inspirada em LingQ)
3. **Assistência por IA multi-provider** (Bring Your Own Key)

O sistema roda self-hosted via **Coolify** em um único ambiente, mas arquitetado como serviços logicamente separados (frontend, backend, banco, storage, TTS) acessíveis como subcontainers.

**Público-alvo**: brasileiros de nível CEFR **A1 até C2**.

**Identidade visual**: inspirada no LingQ — leitura centralizada, palavras coloridas por nível de familiaridade (cor de **fundo**, não do texto), tipografia confortável para leitura longa, modo claro + escuro com toggle.

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend Web + Mobile | **Next.js 15** (App Router) como **PWA** responsivo |
| Linguagem | **TypeScript** (strict) |
| API | **tRPC** sobre Next.js Route Handlers |
| ORM | **Prisma** |
| Banco | **PostgreSQL** |
| Auth | **Auth.js v5** (NextAuth) — Credentials + Google OAuth |
| UI | **Tailwind CSS** + **shadcn/ui** + **Radix** |
| Estado servidor | **TanStack Query** (via tRPC) |
| SRS | **ts-fsrs** (algoritmo FSRS — estado da arte) |
| TTS | **edge-tts** em microserviço Python (FastAPI) |
| Parse EPUB | **epub2** / **epubjs** |
| LLM SDK | **Vercel AI SDK** (providers: Anthropic, Google, OpenAI, OpenRouter) |
| Storage | **MinIO** (S3-compatível) para áudios e EPUBs |
| i18n | **next-intl** |
| Testes | **Vitest** + **Playwright** + **MSW** |
| Deploy | **Coolify** (Docker Compose multi-container) |

---

## 3. Arquitetura (Coolify / Docker Compose)

Um único stack no Coolify com subcontainers:

```
learnEnglish/
├── web           (Next.js 15 — frontend + API tRPC)
├── db            (Postgres 16)
├── storage       (MinIO)
├── tts           (edge-tts FastAPI)
└── migrations    (Prisma migrate — job de inicialização)
```

- Variáveis sensíveis (DB URL, OAuth secrets, chave de criptografia para BYOK) via **Coolify env vars**.
- Volumes persistentes para `db` e `storage`.
- Rede interna Docker; só `web` exposto publicamente.

---

## 4. Modelos de Dados (Prisma — esqueleto)

```prisma
User            // id, email, name, googleId?, passwordHash?, nativeLang, targetLang, cefrLevel, dailyGoalCards, dailyGoalMinutes, uiLang, createdAt
UserApiKey      // userId, provider (enum), encryptedKey, priority, enabled
Deck            // (V1.1 — tags por enquanto)
Card            // id, userId, front, back, audioUrl?, cloze?, tags[], fsrsState (jsonb), direction (EN_PT|PT_EN|BOTH), createdAt
Review          // cardId, rating (Again|Hard|Good|Easy), reviewedAt, scheduledAt, elapsedMs
Book            // id, userId, title, author?, sourceFormat (EPUB|TXT|MD|AI), filePath?, createdAt
Chapter         // bookId, index, title, content (markdown), estimatedCefr?
ReadingSession  // userId, chapterId|aiTextId, startedAt, endedAt?, wordsLearned[]
AiGeneratedText // userId, theme, cefrLevel, content, createdAt
WordFamiliarity // userId, word (lowercased, lemmatized), level (UNKNOWN|LEARNING|REVIEWING|MASTERED|NATIVE), updatedAt
PlacementTest   // userId, startedAt, finishedAt, estimatedCefr, answers (jsonb)
GamificationState // userId, xp, level, currentStreak, longestStreak, lastActiveDate
```

---

## 5. Funcionalidades do MVP

### 5.1 Autenticação
- Signup/login com **email + senha** (bcrypt/argon2)
- Signup/login com **Google OAuth**
- Sessão via Auth.js (JWT ou database session)
- Middleware bloqueia rotas privadas

### 5.2 Wizard de Onboarding (obrigatório, pós-signup)
Bloqueia acesso ao `/dashboard` enquanto não completo.

1. **Boas-vindas**
2. **Idiomas**: nativo (PT-BR pré-selecionado) + alvo (EN). Apenas os suportados aparecem.
3. **API Keys (BYOK)**: mínimo 1 provedor (Claude / Gemini / OpenAI / OpenRouter). Usuário define a **ordem de prioridade** para fallback.
4. **Meta diária**: cards novos/dia + minutos de estudo/dia
5. **Teste de nivelamento CEFR** — obrigatório. Múltipla escolha adaptativa (~15 questões). Avalia A1→C2. **Nunca posiciona o aluno abaixo de A1**, mesmo com baixo desempenho.
6. **Dashboard**

### 5.3 Flashcards SRS
- Algoritmo **FSRS** (via `ts-fsrs`)
- Criação **manual** + **geração por IA** (a partir de uma palavra/frase → definição + exemplo + sinônimos + áudio)
- Campos: `front`, `back`, `audioUrl` (TTS via edge-tts), `cloze` opcional, `tags[]`
- Direção: **EN→PT / PT→EN / ambas**
- Modos de revisão MVP: **ver e lembrar** + **digitação**
- **Pool único** (tags para filtro — UI de deck fica para V1.1)
- **Limite diário** configurável (definido no wizard, editável em Settings)

### 5.4 Leitura Assistida
- **Fontes**:
  - Cole TXT/MD
  - Upload **EPUB** → parser separa em **capítulos**, cada livro vira item da "Minha Biblioteca"
  - Geração por IA: usuário escolhe **tema + nível CEFR** → texto gerado
- **Interação**:
  - Clique em **palavra** → tooltip resumido: tradução + botão **"Adicionar como flashcard"**
  - Clique em **frase** → modal: tradução completa + explicação gramatical
  - **TTS do texto** com highlight palavra-a-palavra (karaokê)
  - Palavras com **cor de fundo** por familiaridade:
    - cinza = desconhecida
    - vermelho = aprendendo
    - amarelo = revisando
    - verde = dominada
    - sem destaque = nativa
- **Sessão de leitura** é persistida por capítulo/texto. Ao final, botão **"Revisar palavras aprendidas nesta sessão"** envia para revisão SRS imediata.
- Cada texto/capítulo tem **nível CEFR estimado** pela IA.

### 5.5 IA Multi-provider (BYOK)
- Configurável em **Settings → API Keys**
- Providers: **Claude, Gemini, OpenAI, OpenRouter**
- **Fallback automático** na ordem definida pelo usuário, disparado em:
  - Erro de rede
  - Rate limit (429)
  - Chave inválida (401/403)
- Chaves **criptografadas em repouso** (AES-256-GCM com chave mestra em env var)
- Tarefas que usam LLM:
  - Gerar textos de leitura por nível CEFR
  - Traduzir palavra/frase em contexto
  - Gerar cards a partir de palavra (definição, exemplo, sinônimos)
  - Explicar gramática de uma frase
  - Estimar nível CEFR de texto importado
  - Avaliar teste de nivelamento

### 5.6 Gamificação
- **Streak diário** (dias consecutivos com meta cumprida)
- **XP** por ação (revisão acertada, palavra aprendida, texto concluído)
- **Níveis** (curva de XP)
- Estatísticas: vocabulário aprendido, tempo de estudo, cards revisados
- Ligas/conquistas/notificações → **V1.1+**

### 5.7 Internacionalização
- UI completa em **PT** e **EN** com **toggle** em Settings
- Default = idioma do browser, fallback PT

### 5.8 Export de Dados
- Export completo do usuário em JSON (LGPD-friendly)
- Deck em formato `.apkg` (Anki) — futuro, mas já prever o adapter

---

## 6. Estrutura de Diretórios (sugestão)

```
learnEnglish/
├── apps/
│   └── web/                 # Next.js 15
│       ├── app/
│       ├── components/
│       ├── server/          # tRPC routers
│       ├── lib/
│       │   ├── llm/         # router multi-provider + fallback
│       │   ├── srs/         # wrapper ts-fsrs
│       │   ├── epub/        # parser
│       │   ├── tts/         # cliente do microserviço
│       │   └── crypto/      # AES-256-GCM para BYOK
│       └── messages/        # next-intl (pt.json, en.json)
├── services/
│   └── tts/                 # FastAPI + edge-tts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docker-compose.yml       # para Coolify
├── Dockerfile.web
├── Dockerfile.tts
└── PROJECT_PROMPT.md        # este arquivo
```

---

## 7. Critérios de "Concluído" (TDD)

O agente TDD gerará a suite de testes em `tests/` que serve como **especificação executável**. Uma feature só é considerada concluída quando:

1. Todos os testes unitários/integração/E2E relacionados passam
2. Lint + TypeScript strict passa sem erros
3. Build de produção (`next build`) passa
4. Fluxo manual funciona no navegador (web + mobile viewport)

Critérios críticos cobertos pelos testes:
- Wizard bloqueia dashboard até conclusão
- Teste de nivelamento nunca coloca < A1
- Fallback LLM nos 3 tipos de erro, respeitando ordem
- FSRS agenda corretamente por rating
- EPUB → N capítulos + sessão persistida
- Clique em palavra → tooltip → flashcard criado integra SRS
- Cor de fundo muda conforme familiaridade
- Meta diária respeitada (não mostra cards novos acima do limite)
- BYOK: CRUD com criptografia em repouso
- Export completo do usuário

---

## 8. Princípios de Implementação

- **TDD estrito**: Red → Green → Refactor. Rode os testes antes de escrever código.
- **Server Components por padrão**, Client Components apenas onde há interatividade.
- **tRPC** para todas as chamadas de API do frontend.
- **Zod** em todos os inputs de API.
- **Acessibilidade** (Radix já entrega grande parte).
- **Performance**: streaming de LLM onde aplicável, suspense boundaries.
- **Segurança**: rate limit por usuário, CSRF (Auth.js), sanitização de HTML em EPUB importado.
- Commits pequenos, mensagens claras em inglês.

---

## 9. Roadmap Pós-MVP (V1.1+)

- Decks nomeados + filtros por tag
- Cloze avançado + modo múltipla escolha + modo listening (ouvir e transcrever)
- Conversação com IA (chat role-play)
- Exercícios de gramática com flashcards explicativos
- Ligas, conquistas, desafios semanais
- Notificações push/email
- PWA offline (revisar cards sem conexão)
- Recalibração periódica de CEFR
- Export `.apkg` para Anki
- Suporte a outros idiomas-alvo (espanhol, francês…)
- App nativo (React Native) se PWA não bastar

---

## 10. Como Usar Este Prompt

1. Em qualquer sessão nova do Claude Code neste diretório, referencie este arquivo:
   > "Leia `PROJECT_PROMPT.md` e implemente a feature X seguindo os testes em `tests/`."
2. Rode o agente TDD **antes** de implementar qualquer feature — os testes são a especificação.
3. Não desvie da stack sem justificativa técnica documentada.
