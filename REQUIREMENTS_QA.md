# learnEnglish — Requisitos (Perguntas & Respostas)

> Registro completo da sessão de refinamento de requisitos que originou o projeto.
> Serve como memória viva das decisões — quando houver ambiguidade no código ou no `PROJECT_PROMPT.md`, este arquivo é a fonte da verdade sobre a intenção original.

---

## Rodada 1 — Fundamentos

**1. Público e idioma**
- P: Qual idioma os usuários vão aprender? Qual o nativo? Qual nível-alvo?
- R: Idioma nativo **português**, aprendendo **inglês**. Sistema deve atender **A1 até C2** (maior nível da certificação europeia / CEFR).

**2. Formato do sistema**
- P: Web, mobile, CLI, desktop, extensão? Individual ou multiusuário?
- R: **Web e Mobile**, rodando no **Coolify**.

**3. Abordagem pedagógica (MVP)**
- P: Flashcards SRS, leitura assistida, conversação, gramática, áudio, imersão?
- R: Para o MVP:
  - Flashcards com repetição espaçada (estilo Anki)
  - Leitura de textos com tradução assistida
  - Demais opções entram em versões futuras, inclusive **aulas de gramática com flashcards com explicações curtas**.

**4. Stack técnica**
- P: Preferência de stack? Uso de IA/LLM? Banco local ou nuvem?
- R: Stack **a escolher pelo Claude** conforme necessidade. IA sim: **Claude API, Gemini API, OpenRouter API e ChatGPT API**, todas configuráveis em **Settings**.

**5. Escopo**
- P: MVP enxuto ou projeto completo?
- R: Por enquanto **apenas algumas funcionalidades** (MVP).

---

## Rodada 2 — Detalhamento

**6. Autenticação**
- R: Sim. Login/cadastro por **email + senha** e **Google OAuth**.

**7. Configuração das APIs de IA**
- R:
  - Usuário traz a própria chave (**BYOK**)
  - **Fallback automático** entre provedores
  - Não rastrear custos por ora

**8. Flashcards**
- R:
  - Algoritmos com **melhor evidência científica de sucesso** (→ escolhido FSRS)
  - Cloze deletion: **sim**
  - Cards com **texto e áudio** (áudio gerado pelo **edge-tts**)

**9. Leitura com tradução assistida**
- R:
  - Usuário pode **gerar com IA** ou **importar textos** em MD, TXT, EPUB e Amazon
  - Tradução por **palavra e por frase** (ambos)
  - Palavras desconhecidas viram flashcards; ao final da sessão, botão para **revisar palavras aprendidas**
  - **Nível CEFR estimado** do texto: sim

**10. Progresso e gamificação**
- R: Com certeza (streak, XP, estatísticas).

**11. Offline / PWA**
- R: Por enquanto **apenas online**.

**12. Privacidade e dados**
- R: Self-hosted no Coolify com backup/export: **sim**.

**13. Idioma da interface**
- R: **PT e EN com toggle**.

---

## Rodada 3 — Refinamento

**14. Teste de nivelamento**
- R: **Obrigatório**, apresentado em **wizard** após o cadastro.

**15. Flashcards — detalhes**
- 15.1 Direção: **EN↔PT ambas** (configurável)
- 15.2 Modos de revisão: por ora **ver e lembrar** + **digitação** (apenas isso no MVP)
- 15.3 Limite diário: **sim**, definido no wizard para medir comprometimento
- 15.4 Decks: **pool único** (sem decks nomeados no MVP)

**16. Leitura — detalhes**
- 16.1 Geração por IA com tema + nível + tamanho: **sim**
- 16.2 Destaque visual por familiaridade: **sim**
- 16.3 TTS do texto com highlight karaokê: **sim**
- 16.4 Amazon/Kindle: **descartado** — foco em **EPUB**. EPUBs devem ser separados em **capítulos** pelo sistema.

**17. Gamificação — escopo**
- R: Sim, mas **ligas, conquistas e notificações ficam para mais adiante**.

**18. IA — tarefas específicas**
- R: **Todas** as apresentadas:
  - Gerar textos de leitura por nível CEFR
  - Traduzir palavra/frase em contexto
  - Gerar cards a partir de uma palavra
  - Explicar gramática de uma frase
  - Estimar nível CEFR de um texto importado
  - Avaliar escrita livre
  - (Correção de pronúncia fica para depois)

**19. Stack recomendada**
- P: Next.js 15 + tRPC + Prisma + Postgres + Auth.js + Tailwind + shadcn + ts-fsrs + edge-tts + Vercel AI SDK + MinIO
- R: **Perfeito**.

**20. Escopo do MVP (checklist)**
- R: **Todos** os itens listados entram no MVP:
  - Auth (email + Google)
  - Flashcards SRS (manual + IA)
  - Leitura com tradução ao clique
  - Leitura gerada por IA
  - Import TXT/MD/EPUB
  - TTS em cards e leitura
  - Teste de nivelamento
  - Streak/XP
  - Settings com BYOK multi-provider + fallback
  - Toggle PT/EN
  - Export de dados

---

## Rodada 4 — Decisões finais

**21. Wizard de onboarding — ordem**
- R: Proposta aprovada, com adição: **idioma nativo + idioma alvo** devem aparecer no wizard (por ora só os suportados).
- Ordem final:
  1. Boas-vindas
  2. Idiomas (nativo + alvo)
  3. API Keys (mínimo 1, define ordem de fallback)
  4. Meta diária (cards + minutos)
  5. Teste de nivelamento CEFR
  6. Dashboard

**22. Teste de nivelamento — duração e piso**
- R: Se aluno falhar em A1, ainda assim **começa em A1** (piso garantido).

**23. Fallback entre LLMs**
- R: Dispara em **todos** os erros: rede, rate limit (429), chave inválida (401/403).

**24. Importação de livros**
- 24.1 **Amazon/Kindle descartado** — apenas EPUB
- 24.2 Leitura por capítulo como **sessões salvas** no progresso: sim
- 24.3 Livros em **biblioteca pessoal** ("Meus livros"): sim

**25. Tradução ao clique**
- R: Popup **resumido**: apenas **Tradução** + botão **Adicionar como flashcard**.
- Clique em frase → modal com tradução completa + explicação gramatical.

**26. Cores de familiaridade**
- R: Paleta aprovada: cinza (desconhecida) → vermelho (aprendendo) → amarelo (revisando) → verde (dominada) → sem destaque (nativa/ignorada).
- **Crítico**: cor aplicada no **fundo** da palavra, não no texto.

**27. Estrutura de decks / tags**
- R: Tags fazem sentido, mas ficam para **V1.1**. MVP usa pool único.

**28. Geração de texto por IA — parâmetros**
- R: Usuário define apenas **tema** e **nível CEFR** (sem foco gramatical específico por ora).

**29. Deploy no Coolify**
- R: **Um único stack** no Coolify, mas arquitetado como **subcontainers** acessíveis independentemente (frontend, backend, banco, storage, TTS).

**30. Nome e branding**
- R: Nome: **learnEnglish** (mantém o nome da pasta por ora).
- Visual: **parecido com o LingQ** (leitura centralizada, palavras coloridas por familiaridade, leitura confortável).

---

## Decisões implícitas derivadas das respostas

- **Idioma nativo default**: PT-BR pré-selecionado no wizard
- **Idioma alvo default**: EN pré-selecionado no wizard
- **Ordem dos providers**: definida pelo usuário no wizard (drag-and-drop nas settings)
- **Chaves de API**: criptografadas em repouso (AES-256-GCM)
- **Modo escuro + claro**: ambos com toggle (consistente com o toggle PT/EN)
- **SRS**: FSRS (state-of-the-art, com melhor evidência científica — critério do item 8.1)
- **Piso CEFR**: A1 é sempre o mínimo retornado pelo scorer
- **Parser EPUB**: capítulos separados automaticamente no upload

---

## Itens adiados para V1.1+

- Conversação com IA (chat role-play)
- Exercícios de gramática com flashcards explicativos
- Cloze múltipla escolha e modo listening
- Ligas, conquistas, desafios semanais
- Notificações push/email
- PWA offline / revisão sem conexão
- Recalibração periódica de CEFR
- Export `.apkg` para Anki
- Outros idiomas-alvo (espanhol, francês, etc.)
- Decks nomeados + filtros por tag
- App nativo (React Native) caso PWA não baste
- Avaliação/correção de pronúncia
- Tracking de custos por usuário
