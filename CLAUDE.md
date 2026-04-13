# CLAUDE.md — learnEnglish

## Workflow obrigatório

**Sempre que implementar algo, rode os testes documentados antes de
considerar a tarefa concluída.** A suíte em `tests/` é a definição de done
(ver `tests/README.md`).

- Após qualquer mudança em `src/**`: rode a categoria relevante.
  - Mudanças em `src/server/**`, `src/lib/**` (lógica pura) → `npm run test:unit`.
  - Mudanças em routers tRPC, auth, db, crypto → `npm run test:integration`
    (requer `docker compose up db -d` + `npx prisma migrate dev`).
  - Mudanças em UI / fluxos → `npm run test:e2e`.
- Antes de marcar uma task como `[x]` em `specs/001-mvp-learnenglish/tasks.md`,
  os testes que a task declara cobrir (tag U/I/E) precisam estar verdes.
- Se um teste quebrar, investigue a causa raiz — **não edite o teste para
  passar** (ver "Philosophy — TDD Red/Green/Refactor" em `tests/README.md`).
- Nunca use `--no-verify` ou pule hooks para contornar falhas de teste.

## Env mínimo para rodar integration

```
DATABASE_URL=postgres://learnenglish:learnenglish@localhost:5433/learnenglish
AUTH_SECRET=testsecret
BYOK_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=
```
