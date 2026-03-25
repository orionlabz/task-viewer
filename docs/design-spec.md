# Task Viewer — Claude Code Plugin Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar um plugin do Claude Code que visualiza a execucao de tasks e planos em tempo real atraves de um dashboard web Kanban, iniciando automaticamente com o Claude Code e encerrando ao sair.

**Plugin Name:** `task-viewer`
**Marketplace:** `orionlabz/task-viewer` (GitHub repo)
**Repo:** `git@github.com:orionlabz/task-viewer.git`
**Dev local:** `~/.claude/plugins/marketplaces/orionlabz/`
**Port:** `localhost:37778`

**Tech Stack:** Node.js, Express, WebSocket (`ws`), chokidar, vanilla HTML/CSS/JS

---

## 1. Estrutura do Plugin

```
~/.claude/plugins/marketplaces/orionlabz/
├── marketplace.json
└── task-viewer/
    ├── .claude-plugin/
    │   └── plugin.json
    ├── hooks/
    │   ├── hooks.json
    │   └── server/
    │       ├── package.json
    │       ├── server.mjs
    │       ├── watchers.mjs
    │       ├── parsers.mjs
    │       └── public/
    │           ├── index.html
    │           ├── styles.css
    │           └── app.js
    ├── skills/
    │   └── task-viewer/
    │       └── SKILL.md
    └── README.md
```

---

## 2. Fontes de Dados

### 2.1 Tasks do Claude Code (tempo real)

- **Path:** `~/.claude/tasks/{sessionId}/*.json`
- **Formato:**
  ```json
  {
    "id": "1",
    "subject": "Task title",
    "description": "Detailed description",
    "activeForm": "Doing something...",
    "status": "pending|in_progress|completed|deleted",
    "blocks": ["2"],
    "blockedBy": ["1"]
  }
  ```
- **Deteccao de sessao:** Escaneia `~/.claude/sessions/{pid}.json` filtrando por `cwd` igual ao `PROJECT_CWD`
- **Colunas kanban:** Pending → In Progress → Completed

### 2.2 Specs Superpowers (design docs)

- **Path:** `{PROJECT_CWD}/docs/superpowers/specs/*.md`
- **Parsing:**
  - Extrai titulo do `# heading` principal
  - Extrai data do nome do arquivo (`YYYY-MM-DD-<topic>-design.md`)
  - Extrai `<topic>` slug do nome do arquivo para vinculo com planos
- **Vinculo com planos:** Matcheia spec `<topic>` com plan `<topic>` pelo slug compartilhado no nome do arquivo (ex: `2026-03-24-task-viewer-plugin-design.md` vincula a `2026-03-24-task-viewer-plugin.md`)

### 2.3 Planos Superpowers (parsing markdown)

- **Path:** `{PROJECT_CWD}/docs/superpowers/plans/*.md`
- **Parsing:**
  - Headers `### Task N:` → tarefas principais
  - Checkboxes `- [ ]` / `- [x]` → subtasks
  - Calcula percentual de conclusao por task e por plano
- **Vinculo com specs:** Cada plano tenta encontrar um spec com slug correspondente. Se encontrado, exibe como item pai no dashboard.

### 2.4 Historico de Sessoes

- **Descoberta:** Escaneia `~/.claude/sessions/*.json` filtrando por `cwd === PROJECT_CWD` para obter todos os `sessionId`s do projeto. Cruza com diretorios existentes em `~/.claude/tasks/{sessionId}/` para confirmar que ha tasks.
- **Comportamento:** Lista todas as sessoes do projeto, carrega tasks sob demanda (lazy loading)
- **Exibicao:** Sessoes anteriores como itens colapsaveis, expandem para mostrar kanban completo

---

## 3. Layout do Dashboard

Estrutura hibrida de cima para baixo:

### 3.1 Header

- Logo Aurora (favicon.svg) + titulo "Aurora Task Viewer"
- Subtitulo "Siderea Academy"
- Indicador de sessao ativa (session ID truncado + status dot)

### 3.2 Sessao Ativa (Kanban)

- Tres colunas: **Pending** | **In Progress** | **Completed**
- Cards mostram: subject, activeForm (se in_progress), description truncada
- Contador de tasks por coluna
- Dependencias (blocks/blockedBy) indicadas visualmente

### 3.3 Specs & Planos Superpowers

- Agrupados hierarquicamente: **Spec → Plan → Tasks → Steps**
- Specs aparecem como card pai com icone 📄 e data
- Plans aninhados abaixo do spec vinculado, com barra de progresso global
- Plans sem spec vinculado aparecem standalone
- Specs sem plan vinculado aparecem com indicador "(plan not yet created)"
- Expandivel para ver tasks individuais com suas barras de progresso
- Subtasks como checkboxes visuais (somente leitura)

### 3.4 Historico

- Lista cronologica reversa de sessoes anteriores
- Cada sessao mostra: data/hora, quantidade de tasks, resumo
- Clicavel para expandir e ver o kanban daquela sessao

---

## 4. Tema Visual — Aurora Identity

Replica a identidade visual do frontend Aurora:

### Cores (OKLch)

**Dark mode (padrao):**
- Background: `oklch(0.1487 0.0102 268.43)` (dark blue-gray)
- Foreground: `oklch(0.985 0.002 247.839)` (near white)
- Primary: `oklch(0.541 0.281 293.009)` (purple)
- Card: `oklch(0.1933 0.0206 268.43)` (dark card)
- Muted: `oklch(0.373 0.034 259.733)` (muted text)
- Destructive: `oklch(0.637 0.237 25.331)` (red)

**Status colors:**
- Pending: muted foreground
- In Progress: primary purple com animacao pulse
- Completed: verde (custom, harmonizado com a paleta)

### Tipografia

- Body: Inter (sans-serif)
- Titulos: Aleo (serif)
- IDs/status/code: IBM Plex Mono (monospace)

### Espacamento

- Border radius: 18px (base), 14px (sm), 22px (xl)
- Spacing unit: 4px

---

## 5. Arquitetura Tecnica

### 5.1 Server (`server.mjs`)

- Express serve arquivos estaticos de `public/`
- WebSocket server via `ws` library
- Envia eventos tipados para o browser:
  - `tasks:update` — estado completo das tasks da sessao ativa
  - `specs:update` — specs parseados com vinculos a planos
  - `plans:update` — estado dos planos parseados
  - `session:change` — nova sessao ativa detectada
  - `history:load` — dados de sessoes historicas (sob demanda)
- Heartbeat a cada 30s
- Graceful shutdown em SIGTERM

### 5.2 Watchers (`watchers.mjs`)

Quatro watchers via chokidar:

1. **Task watcher:** `~/.claude/tasks/{activeSessionId}/*.json`
   - Dispara em add/change de arquivos .json
   - Debounce 200ms
   - Recarrega todas as tasks e envia via WS

2. **Spec watcher:** `{PROJECT_CWD}/docs/superpowers/specs/*.md`
   - Dispara em add/change de arquivos .md
   - Debounce 200ms
   - Re-parseia specs e recalcula vinculos com planos

3. **Plan watcher:** `{PROJECT_CWD}/docs/superpowers/plans/*.md`
   - Dispara em add/change de arquivos .md
   - Debounce 200ms
   - Re-parseia o plano alterado e envia via WS

4. **Session watcher:** `~/.claude/sessions/*.json`
   - Detecta nova sessao ativa do mesmo projeto
   - Troca o task watcher para o novo sessionId
   - Permite que o viewer sobreviva a multiplas sessoes

### 5.3 Parsers (`parsers.mjs`)

- `parseTask(jsonPath)` → le arquivo JSON e retorna objeto task
- `parseSpec(mdPath)` → extrai titulo, data e topic slug do spec
- `parsePlan(mdPath)` → extrai titulo, tasks e steps com estado dos checkboxes, calcula progresso
- `linkSpecsAndPlans(specs, plans)` → vincula specs a plans pelo topic slug compartilhado, retorna arvore hierarquica
- `discoverProjectSessions(projectCwd)` → escaneia sessions/*.json por cwd, cruza com tasks dirs, retorna lista de sessoes
- `findActiveSessions(projectCwd)` → encontra sessoes ativas filtradas por cwd

### 5.4 Client (`public/app.js`)

- Vanilla JS, sem framework
- WebSocket client com reconexao automatica (backoff exponencial)
- Renderiza kanban via DOM manipulation
- Indicador de conexao WS (verde/vermelho)
- Animacoes CSS para transicoes de estado (cards mudando de coluna)

### 5.5 Dependencies

```json
{
  "express": "^4",
  "ws": "^8",
  "chokidar": "^4",
  "open": "^10"
}
```

> Express 4 escolhido sobre v5 por estabilidade — o server e simples demais para precisar das mudancas do v5.

---

## 6. Hooks e Lifecycle

### 6.1 hooks.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "PROJECT_CWD=\"$PWD\" && HASH=$(echo -n \"$PROJECT_CWD\" | if command -v md5 >/dev/null 2>&1; then md5 -q; else md5sum | cut -d' ' -f1; fi) && cd \"${CLAUDE_PLUGIN_ROOT}/hooks/server\" && ([ -d node_modules ] || npm install --silent) && PROJECT_CWD=\"$PROJECT_CWD\" nohup node server.mjs > /tmp/task-viewer-$HASH.log 2>&1 & echo $! > /tmp/task-viewer-$HASH.pid",
            "timeout": 30000,
            "statusMessage": "Starting Task Viewer..."
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "HASH=$(echo -n \"$PWD\" | if command -v md5 >/dev/null 2>&1; then md5 -q; else md5sum | cut -d' ' -f1; fi) && if [ -f /tmp/task-viewer-$HASH.pid ]; then kill $(cat /tmp/task-viewer-$HASH.pid) 2>/dev/null; rm -f /tmp/task-viewer-$HASH.pid; fi",
            "timeout": 5000,
            "statusMessage": "Stopping Task Viewer..."
          }
        ]
      }
    ]
  }
}
```

### 6.2 Deteccao de Sessao Ativa

1. Server recebe `PROJECT_CWD` como env var
2. Escaneia `~/.claude/sessions/*.json` procurando `cwd === PROJECT_CWD`
3. Usa o `sessionId` encontrado para montar path `~/.claude/tasks/{sessionId}/`
4. Session watcher detecta novas sessoes e troca o task watcher dinamicamente

### 6.3 Port Conflict Handling

- Antes de iniciar, o hook mata processos stale checando o PID file
- Se a porta ainda estiver ocupada, o server loga erro e encerra (nao tenta porta alternativa)

### 6.4 Browser Auto-Open

- Apos o server comecar a escutar na porta, usa `open` para abrir `http://localhost:37778`
- Flag interna previne reabrir em reconexoes

---

## 7. Skill `/task-viewer`

Skill de diagnostico e acesso rapido:

- Verifica se o server esta rodando (checa PID file + porta)
- Se rodando: mostra URL e status
- Se nao rodando: orienta como reiniciar manualmente
- Trigger: quando usuario pergunta sobre o viewer, dashboard, ou kanban de tasks

---

## 8. Decisoes de Design

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Framework frontend | Vanilla JS | Simplicidade, zero build step, carga rapida |
| WebSocket lib | `ws` | Leve, sem overhead de Socket.IO |
| File watcher | `chokidar` | Confiavel cross-platform, eficiente |
| Tema | Dark mode Aurora | Consistencia visual com o projeto |
| Dados somente leitura | Sim | Evita conflitos com Claude Code escrevendo tasks |
| Historico completo | Sim | Permite rastrear trabalho entre sessoes |
| Porta fixa | 37778 | Consistente com config anterior |
| Express 4 | Sim | Mais estavel que v5, suficiente para static + WS |
| PID per-project | Hash do CWD | Suporta multiplas instancias simultaneas |

---

## 9. Manifestos

### 9.1 marketplace.json

```json
{
  "name": "task-viewer",
  "description": "Real-time task visualization plugins for Claude Code",
  "owner": {
    "name": "OrionLabz"
  },
  "plugins": [
    {
      "name": "task-viewer",
      "description": "Real-time task visualization dashboard for Claude Code sessions with Superpowers plan tracking",
      "version": "0.1.0",
      "source": "./task-viewer",
      "author": {
        "name": "Paulo Jalowyj"
      }
    }
  ]
}
```

### 9.2 plugin.json

```json
{
  "name": "task-viewer",
  "description": "Real-time Kanban dashboard that visualizes Claude Code tasks and Superpowers plans. Auto-starts with sessions on localhost:37778."
}
```

---

## 10. Estados Vazios e Erros do Dashboard

| Estado | Exibicao |
|--------|----------|
| Nenhuma sessao ativa | Mensagem "Waiting for Claude Code session..." com animacao pulse |
| Sessao ativa sem tasks | Kanban vazio com texto "No tasks yet — Claude will create them as it works" |
| Sem diretorio de planos | Secao de planos oculta |
| WebSocket desconectado | Banner topo com "Reconnecting..." e indicador vermelho |
| Sem historico | Secao de historico com "No previous sessions found" |

---

## 11. Compatibilidade Cross-Platform

O plugin deve funcionar em **macOS** e **Linux** sem alteracoes.

### Consideracoes

| Aspecto | macOS | Linux | Solucao |
|---------|-------|-------|---------|
| Hash do CWD | `md5 -q` | `md5sum \| cut -d' ' -f1` | Deteccao automatica via `command -v md5` |
| Paths | `~/.claude/` | `~/.claude/` | Identico |
| `open` (npm) | Abre browser via `open` | Abre browser via `xdg-open` | A lib `open` ja trata isso internamente |
| `nohup` | Disponivel | Disponivel | Identico |
| File watching | FSEvents | inotify | chokidar abstrai ambos |
| Node.js | Requer Node 18+ | Requer Node 18+ | Identico |

### Hash helper nos hooks

O hash do `PROJECT_CWD` usa deteccao automatica:
```bash
echo -n "$PWD" | if command -v md5 >/dev/null 2>&1; then md5 -q; else md5sum | cut -d' ' -f1; fi
```

---

## 12. Instalacao e Distribuicao

### Repositorio

- **GitHub:** `git@github.com:orionlabz/task-viewer.git`
- **Estrutura do repo:**
  ```
  task-viewer/
  ├── marketplace.json          # Manifesto do marketplace
  ├── task-viewer/              # Plugin
  │   ├── .claude-plugin/
  │   │   └── plugin.json
  │   ├── hooks/
  │   ├── skills/
  │   └── README.md
  ├── LICENSE
  └── README.md                 # Docs do marketplace
  ```

### Instalacao em qualquer maquina

```bash
# Adicionar o marketplace
claude plugins add-marketplace orionlabz/task-viewer

# Instalar o plugin
claude plugins add task-viewer --marketplace orionlabz/task-viewer
```

### O que acontece automaticamente apos instalar

1. Claude Code registra o plugin em `~/.claude/plugins/installed_plugins.json`
2. Os hooks de `hooks/hooks.json` sao carregados automaticamente
3. Na proxima sessao do Claude Code:
   - `SessionStart` inicia o server na porta 37778
   - O browser abre em `http://localhost:37778`
4. Ao encerrar a sessao:
   - `Stop` mata o processo do server
5. A skill `/task-viewer` fica disponivel para diagnostico

### Atualizacao

```bash
claude plugins update task-viewer
```

### Pre-requisitos

- Claude Code CLI instalado
- Node.js 18+
- Plugin Superpowers instalado (para visualizacao de specs/plans)
