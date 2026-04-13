# Spec 001 — MVP learnEnglish

**Status:** Active
**Owner:** —
**Created:** 2026-04-12
**Source docs:** [`PROJECT_PROMPT.md`](../../PROJECT_PROMPT.md), [`REQUIREMENTS_QA.md`](../../REQUIREMENTS_QA.md)

---

## 1. Contexto e problema
Brasileiros que querem aprender inglês têm apps fragmentados: um para
flashcards (Anki), outro para leitura (LingQ), outro para conversação.
Nenhum combina SRS de última geração (FSRS), leitura extensiva assistida
com destaque por familiaridade e assistência LLM **trazida pelo próprio
usuário** (BYOK), self-hosted.

## 2. Objetivo
Entregar um MVP self-hosted via Coolify que cubra os três pilares:
repetição espaçada, leitura extensiva e IA multi-provider, para
aprendizes A1–C2.

## 3. Personas
- **Aluno iniciante (A1/A2)** — pt-BR nativo, pouco vocabulário em EN.
- **Aluno intermediário (B1/B2)** — quer ler livros reais em EN com apoio.
- **Aluno avançado (C1/C2)** — refina vocabulário especializado + gramática.

## 4. Requisitos funcionais (MVP)

### RF-1 Autenticação
- Signup/login email+senha (hash argon2/bcrypt).
- Signup/login Google OAuth via Auth.js v5.
- Sessão persistida (JWT ou database session).

### RF-2 Onboarding (wizard obrigatório)
Ordem fixa: Boas-vindas → Idiomas (nativo+alvo) → API Keys (≥1) → Meta
diária → Teste de nivelamento CEFR → Dashboard. Bloqueia `/dashboard`
até conclusão.

### RF-3 Flashcards SRS
- Algoritmo FSRS via `ts-fsrs`.
- Criação manual + geração via IA a partir de palavra/tema.
- Campos: `front`, `back`, `audioUrl?`, `cloze?`, `tags[]`, `direction`
  (EN→PT, PT→EN, BOTH).
- Modos de revisão: ver-e-lembrar + digitação.
- Pool único (tags como filtro).
- Limite diário de cards novos configurável.

### RF-4 Leitura assistida
- Fontes: paste TXT/MD, upload EPUB (parser por capítulos), geração IA
  (tema + nível CEFR).
- Clique em palavra → tooltip: tradução + "Adicionar como flashcard".
- Clique em frase → modal: tradução + notas gramaticais.
- TTS com highlight karaokê palavra-a-palavra.
- Cor de **fundo** por familiaridade: cinza / vermelho / amarelo / verde /
  sem destaque.
- Sessão persistida por capítulo/texto; botão final "Revisar palavras
  aprendidas".

### RF-5 IA multi-provider (BYOK)
- Providers: Claude, Gemini, OpenAI, OpenRouter.
- Chaves criptografadas AES-256-GCM em repouso.
- Fallback automático (ordem do usuário) em: rede, 429, 401/403.
- Tarefas: gerar texto por CEFR, traduzir palavra/frase, gerar cards,
  explicar gramática, estimar CEFR de texto, avaliar nivelamento.

### RF-6 Gamificação
- Streak diário, XP por ação, nível por curva de XP.
- Estatísticas: vocabulário aprendido, tempo de estudo, cards revisados.
- Ligas/conquistas/notificações → V1.1+.

### RF-7 i18n
UI completa em PT-BR e EN com toggle. Default = idioma do browser,
fallback PT-BR.

### RF-8 Export de dados
Export completo do usuário em JSON (LGPD). **Nunca incluir API keys**.

## 5. Requisitos não-funcionais

- **NF-1 Segurança:** AES-256-GCM para BYOK, CSRF via Auth.js, rate
  limit por usuário em rotas LLM/TTS/upload, sanitização de EPUB.
- **NF-2 Acessibilidade:** navegação por teclado, contraste WCAG AA.
- **NF-3 Performance:** streaming de LLM onde aplicável; suspense.
- **NF-4 Self-hosting:** um stack Coolify, subcontainers isolados, só
  `web` exposto publicamente.
- **NF-5 Observabilidade mínima:** logs estruturados (sem PII sensível).

## 6. Invariantes (cobertas por testes)
1. Wizard bloqueia dashboard até completo.
2. Teste de nivelamento nunca retorna < A1.
3. Fallback LLM cobre os 3 tipos de erro respeitando ordem do usuário.
4. FSRS agenda corretamente por rating.
5. EPUB → N capítulos + sessão persistida.
6. Clique em palavra → tooltip → flashcard criado integra ao SRS.
7. Cor de fundo muda conforme familiaridade.
8. Meta diária respeitada (não mostra novos acima do limite).
9. BYOK: CRUD com criptografia em repouso; nunca em plaintext no client.
10. Export nunca contém API keys.

## 7. Fora de escopo (MVP)
Ver `REQUIREMENTS_QA.md` §"Itens adiados para V1.1+".

## 8. Critérios de aceitação
1. Todos os testes em `tests/unit`, `tests/integration`, `tests/e2e` verdes.
2. `pnpm build` (ou `npm run build`) passa sem erros.
3. `tsc --noEmit` strict sem erros.
4. Stack sobe com `docker compose up` e fluxos manuais funcionam.

## 9. Riscos conhecidos
- **R1**: Providers LLM mudam formato de erro → mitigado por handlers
  isolados por provider.
- **R2**: EPUBs malformados → parser tolerante + sandbox de sanitização.
- **R3**: Crescimento de `ReadingWord` (N palavras × M usuários) → índice
  em `(userId, word)` já previsto no schema.
