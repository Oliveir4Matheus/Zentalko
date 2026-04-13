# Specs

Spec-Driven Development. Cada feature vive em `NNN-slug/` com `spec.md`
(QUÊ/POR QUÊ), `plan.md` (COMO) e `tasks.md` (unidades executáveis).

Princípios globais: [`.specify/memory/constitution.md`](../.specify/memory/constitution.md).

## Índice

| ID | Título | Status |
|---|---|---|
| [001](./001-mvp-learnenglish/spec.md) | MVP learnEnglish | Active — Fase A concluída; B em aberto |

## Fluxo
1. Escrever/atualizar `spec.md` (requisitos, invariantes, aceitação).
2. Escrever/atualizar `plan.md` (arquitetura, contratos, fases).
3. Quebrar em `tasks.md` com checkboxes.
4. Implementar por task; atualizar checkbox no mesmo commit.
5. PR referencia `specs/NNN-slug/` e cita ID da task.
