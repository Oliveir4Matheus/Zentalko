# learnEnglish — Constitution

> Princípios não-negociáveis. Qualquer `spec.md`, `plan.md` ou PR que os viole
> precisa de justificativa explícita e aprovação do mantenedor.

## I. Spec-Driven Development (SDD)
Toda feature começa por **spec** (o QUÊ/POR QUÊ), depois **plan** (o COMO),
depois **tasks** (unidades executáveis), depois código. Código que chega sem
spec correspondente é revertido. Specs ficam em `specs/NNN-slug/`.

## II. Testes são a especificação executável (TDD)
Ordem obrigatória: **Red → Green → Refactor**. Testes são escritos antes do
código de produção e nunca são editados para acomodar uma implementação
quebrada — se um teste está errado, corrigir em commit dedicado com
justificativa. Unit, integration e e2e ficam em `tests/`.

## III. Stack fechada
Next.js 15 (App Router) · TypeScript strict · tRPC · Prisma · PostgreSQL ·
Auth.js v5 · Tailwind + shadcn/ui · ts-fsrs · edge-tts (FastAPI) ·
Vercel AI SDK · MinIO · next-intl. Mudar qualquer peça exige ADR em
`specs/NNN-slug/plan.md` com justificativa técnica.

## IV. BYOK é sagrado
Chaves de LLM do usuário **sempre** criptografadas em repouso (AES-256-GCM
com chave mestra em env var). Nunca retornadas em plaintext por nenhuma API,
nunca incluídas em exports, nunca logadas. Mascarar para exibição.

## V. Piso CEFR = A1
Teste de nivelamento nunca posiciona o aluno abaixo de A1, independentemente
do desempenho. Propriedade invariante coberta por teste.

## VI. Fallback multi-provider não é opcional
O LLM router faz fallback automático na ordem definida pelo usuário em **três**
classes de erro: rede, rate limit (429), chave inválida (401/403). Sem exceção.

## VII. Onboarding é portal fechado
`/dashboard` e demais rotas privadas ficam bloqueadas até o wizard estar 100%
completo (idiomas + ≥1 API key + metas + teste de nivelamento).

## VIII. Server Components por padrão
Client Components apenas onde há interatividade explícita. tRPC + Zod em toda
borda de API. Nunca expor Prisma direto ao client.

## IX. Acessibilidade e i18n desde o dia 1
Toda UI é navegável por teclado (Radix entrega a base), toggle PT/EN
funciona em qualquer tela, modo claro+escuro.

## X. Segurança de fronteira
Validar apenas nas bordas (input de usuário, APIs externas). Rate limit por
usuário nas rotas tRPC custosas (LLM, TTS, upload). CSRF via Auth.js.
Sanitizar HTML de EPUB importado.

## Governança
- Pull requests devem referenciar o `specs/NNN-slug/` aplicável.
- `tasks.md` é atualizado conforme tarefas mudam de estado (`[ ]` → `[x]`).
- Qualquer desvio da constitution exige menção explícita na descrição do PR.
