# Carousel Builder CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `carousel` CLI command that manages the HTTP bridge (start/stop/status/logs) from any directory, installed automatically by the plugin hook or via a standalone curl script.

**Architecture:** A Node.js CLI at `bin/carousel.js` resolves the server path via `import.meta.url` so it works from any CWD. A symlink at `~/.local/bin/carousel` is the only artifact outside the plugin folder — created by `hooks/post-install.sh` on plugin install, or by `install.sh` for standalone curl installs.

**Tech Stack:** Node.js (ESM, no external deps), bash (hook + installer)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `carousel-builder/bin/carousel.js` | Create | CLI entry — all 4 subcommands |
| `carousel-builder/hooks/post-install.sh` | Create | Plugin install hook — creates symlink |
| `carousel-builder/install.sh` | Create | Standalone curl installer |

---

## Task 1: CLI skeleton — resolve path + help output

**Files:**
- Create: `carousel-builder/bin/carousel.js`

- [ ] **Step 1: Create the file with shebang and path resolution**

```js
#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync, unlinkSync, createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, '..');
const SERVER = resolve(PLUGIN_ROOT, 'server', 'mcp-server.js');
const PORT = 37776;
const PID_FILE = '/tmp/carousel-bridge.pid';
const LOG_FILE = '/tmp/carousel-bridge.log';

const [,, cmd] = process.argv;

const COMMANDS = {
  start:  cmdStart,
  stop:   cmdStop,
  status: cmdStatus,
  logs:   cmdLogs,
};

const fn = COMMANDS[cmd];
if (!fn) {
  console.log(`carousel <start|stop|status|logs>`);
  process.exit(cmd ? 1 : 0);
}
fn();
```

- [ ] **Step 2: Make the file executable**

```bash
chmod +x carousel-builder/bin/carousel.js
```

- [ ] **Step 3: Smoke-test path resolution**

```bash
node carousel-builder/bin/carousel.js
```

Expected output:
```
carousel <start|stop|status|logs>
```

- [ ] **Step 4: Commit**

```bash
git add carousel-builder/bin/carousel.js
git commit -m "feat(cli): skeleton with path resolution and help output"
```

---

## Task 2: `carousel start`

**Files:**
- Modify: `carousel-builder/bin/carousel.js` (append `cmdStart`)

- [ ] **Step 1: Add the `isRunning` helper and `cmdStart` function**

Append to `carousel-builder/bin/carousel.js`:

```js
function readPid() {
  try { return parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10); } catch { return null; }
}

function isRunning(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function cmdStart() {
  const pid = readPid();
  if (isRunning(pid)) {
    console.log(`carousel bridge already running (PID ${pid}) on http://localhost:${PORT}`);
    return;
  }
  const log = createWriteStream(LOG_FILE, { flags: 'a' });
  const child = spawn('node', [SERVER], {
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  writeFileSync(PID_FILE, String(child.pid));
  console.log(`carousel bridge started (PID ${child.pid}) — http://localhost:${PORT}`);
  console.log(`logs: ${LOG_FILE}`);
  setTimeout(() => {
    spawn('open', [`http://localhost:${PORT}`], { detached: true, stdio: 'ignore' }).unref();
  }, 800);
}
```

- [ ] **Step 2: Smoke-test start**

```bash
node carousel-builder/bin/carousel.js start
```

Expected:
```
carousel bridge started (PID xxxxx) — http://localhost:37776
logs: /tmp/carousel-bridge.log
```

- [ ] **Step 3: Verify PID file was created**

```bash
cat /tmp/carousel-bridge.pid
```

Expected: a number matching the PID printed above.

- [ ] **Step 4: Verify bridge is up**

```bash
curl -s http://localhost:37776/api/ping
```

Expected: `{"ok":true}`

- [ ] **Step 5: Verify no-op if already running**

```bash
node carousel-builder/bin/carousel.js start
```

Expected:
```
carousel bridge already running (PID xxxxx) on http://localhost:37776
```

- [ ] **Step 6: Kill bridge manually before next task**

```bash
kill $(cat /tmp/carousel-bridge.pid) && rm /tmp/carousel-bridge.pid
```

- [ ] **Step 7: Commit**

```bash
git add carousel-builder/bin/carousel.js
git commit -m "feat(cli): carousel start command"
```

---

## Task 3: `carousel stop`

**Files:**
- Modify: `carousel-builder/bin/carousel.js` (append `cmdStop`)

- [ ] **Step 1: Add `cmdStop`**

Append to `carousel-builder/bin/carousel.js`:

```js
function cmdStop() {
  const pid = readPid();
  if (!isRunning(pid)) {
    console.log('carousel bridge is not running.');
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
    unlinkSync(PID_FILE);
    console.log(`carousel bridge stopped (PID ${pid}).`);
  } catch (e) {
    console.error(`Failed to stop: ${e.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Start the bridge then stop it**

```bash
node carousel-builder/bin/carousel.js start
sleep 1
node carousel-builder/bin/carousel.js stop
```

Expected:
```
carousel bridge started (PID xxxxx) — http://localhost:37776
logs: /tmp/carousel-bridge.log
carousel bridge stopped (PID xxxxx).
```

- [ ] **Step 3: Verify process is gone**

```bash
curl -s --max-time 1 http://localhost:37776/api/ping
```

Expected: connection refused / empty.

- [ ] **Step 4: Verify stop is idempotent**

```bash
node carousel-builder/bin/carousel.js stop
```

Expected:
```
carousel bridge is not running.
```

- [ ] **Step 5: Commit**

```bash
git add carousel-builder/bin/carousel.js
git commit -m "feat(cli): carousel stop command"
```

---

## Task 4: `carousel status`

**Files:**
- Modify: `carousel-builder/bin/carousel.js` (append `cmdStatus`)

- [ ] **Step 1: Add `cmdStatus`**

Append to `carousel-builder/bin/carousel.js`:

```js
function cmdStatus() {
  const pid = readPid();
  if (!isRunning(pid)) {
    console.log('carousel bridge: stopped');
    return;
  }
  // Approximate uptime via ps
  const ps = spawn('ps', ['-o', 'etime=', '-p', String(pid)], { stdio: ['ignore', 'pipe', 'ignore'] });
  let etime = '';
  ps.stdout.on('data', d => (etime += d));
  ps.on('close', () => {
    console.log(`carousel bridge: running`);
    console.log(`  PID:    ${pid}`);
    console.log(`  Port:   ${PORT}`);
    console.log(`  Uptime: ${etime.trim()}`);
    console.log(`  Logs:   ${LOG_FILE}`);
  });
}
```

- [ ] **Step 2: Smoke-test status when stopped**

```bash
node carousel-builder/bin/carousel.js status
```

Expected:
```
carousel bridge: stopped
```

- [ ] **Step 3: Start bridge and check status**

```bash
node carousel-builder/bin/carousel.js start
sleep 1
node carousel-builder/bin/carousel.js status
```

Expected (values will differ):
```
carousel bridge: running
  PID:    12345
  Port:   37776
  Uptime: 00:01
  Logs:   /tmp/carousel-bridge.log
```

- [ ] **Step 4: Stop bridge**

```bash
node carousel-builder/bin/carousel.js stop
```

- [ ] **Step 5: Commit**

```bash
git add carousel-builder/bin/carousel.js
git commit -m "feat(cli): carousel status command"
```

---

## Task 5: `carousel logs`

**Files:**
- Modify: `carousel-builder/bin/carousel.js` (append `cmdLogs`)

- [ ] **Step 1: Add `cmdLogs`**

Append to `carousel-builder/bin/carousel.js`:

```js
function cmdLogs() {
  if (!existsSync(LOG_FILE)) {
    console.log(`No log file yet. Run 'carousel start' first.`);
    process.exit(1);
  }
  spawn('tail', ['-f', LOG_FILE], { stdio: 'inherit' });
}
```

- [ ] **Step 2: Smoke-test logs with no file**

```bash
rm -f /tmp/carousel-bridge.log
node carousel-builder/bin/carousel.js logs
```

Expected:
```
No log file yet. Run 'carousel start' first.
```

- [ ] **Step 3: Start bridge and tail logs**

```bash
node carousel-builder/bin/carousel.js start
node carousel-builder/bin/carousel.js logs
```

Expected: live tail of `/tmp/carousel-bridge.log`. Press Ctrl+C to exit.

- [ ] **Step 4: Stop bridge**

```bash
node carousel-builder/bin/carousel.js stop
```

- [ ] **Step 5: Commit**

```bash
git add carousel-builder/bin/carousel.js
git commit -m "feat(cli): carousel logs command"
```

---

## Task 6: Plugin install hook

**Files:**
- Create: `carousel-builder/hooks/post-install.sh`

- [ ] **Step 1: Create the hook script**

```bash
mkdir -p carousel-builder/hooks
```

Create `carousel-builder/hooks/post-install.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Resolve plugin root from this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
CLI_SRC="$PLUGIN_ROOT/bin/carousel.js"
LINK_DIR="$HOME/.local/bin"
LINK_PATH="$LINK_DIR/carousel"

chmod +x "$CLI_SRC"
mkdir -p "$LINK_DIR"

if [ -L "$LINK_PATH" ]; then
  rm "$LINK_PATH"
fi

ln -s "$CLI_SRC" "$LINK_PATH"
echo "carousel CLI installed → $LINK_PATH"

# Warn if ~/.local/bin is not in PATH
if ! echo "$PATH" | tr ':' '\n' | grep -qx "$LINK_DIR"; then
  echo ""
  echo "WARNING: $LINK_DIR is not in your PATH."
  echo "Add this to your shell profile (~/.zshrc or ~/.bashrc):"
  echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
fi
```

- [ ] **Step 2: Make hook executable**

```bash
chmod +x carousel-builder/hooks/post-install.sh
```

- [ ] **Step 3: Run hook manually to verify**

```bash
bash carousel-builder/hooks/post-install.sh
```

Expected:
```
carousel CLI installed → /Users/<you>/.local/bin/carousel
```
(Plus PATH warning if `~/.local/bin` isn't in PATH.)

- [ ] **Step 4: Verify symlink**

```bash
ls -la ~/.local/bin/carousel
carousel status
```

Expected: symlink points to the `bin/carousel.js` file; `status` prints bridge state.

- [ ] **Step 5: Commit**

```bash
git add carousel-builder/hooks/post-install.sh
git commit -m "feat(cli): post-install hook creates ~/.local/bin/carousel symlink"
```

---

## Task 7: Standalone curl installer

**Files:**
- Create: `carousel-builder/install.sh`

- [ ] **Step 1: Create `install.sh`**

Create `carousel-builder/install.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

GITHUB_REPO="orionlabz/orionlabz"
BRANCH="main"
PLUGIN_SUBDIR="carousel-builder"
INSTALL_DIR="$HOME/.local/share/carousel-builder"
LINK_DIR="$HOME/.local/bin"
LINK_PATH="$LINK_DIR/carousel"

echo "Carousel Builder CLI installer"
echo ""

# Check if already installed via Claude Code plugin
CLAUDE_PLUGIN_PATH="$HOME/.claude/plugins/marketplaces/orionlabz/$PLUGIN_SUBDIR"
if [ -d "$CLAUDE_PLUGIN_PATH" ]; then
  echo "Found Claude Code plugin at $CLAUDE_PLUGIN_PATH"
  PLUGIN_ROOT="$CLAUDE_PLUGIN_PATH"
else
  echo "Fetching carousel-builder from GitHub..."
  mkdir -p "$INSTALL_DIR"
  # Sparse checkout — only the carousel-builder directory
  git -C "$INSTALL_DIR" init -q 2>/dev/null || true
  git -C "$INSTALL_DIR" remote get-url origin &>/dev/null || \
    git -C "$INSTALL_DIR" remote add origin "https://github.com/$GITHUB_REPO.git"
  git -C "$INSTALL_DIR" sparse-checkout init --cone
  git -C "$INSTALL_DIR" sparse-checkout set "$PLUGIN_SUBDIR"
  git -C "$INSTALL_DIR" fetch --depth=1 origin "$BRANCH" -q
  git -C "$INSTALL_DIR" checkout "$BRANCH" -q
  PLUGIN_ROOT="$INSTALL_DIR/$PLUGIN_SUBDIR"
fi

CLI_SRC="$PLUGIN_ROOT/bin/carousel.js"
chmod +x "$CLI_SRC"
mkdir -p "$LINK_DIR"

if [ -L "$LINK_PATH" ]; then rm "$LINK_PATH"; fi
ln -s "$CLI_SRC" "$LINK_PATH"
echo "carousel CLI installed → $LINK_PATH"

if ! echo "$PATH" | tr ':' '\n' | grep -qx "$LINK_DIR"; then
  echo ""
  echo "WARNING: $LINK_DIR is not in your PATH."
  echo "Add this to your shell profile (~/.zshrc or ~/.bashrc):"
  echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
fi
```

- [ ] **Step 2: Make executable**

```bash
chmod +x carousel-builder/install.sh
```

- [ ] **Step 3: Smoke-test the "already installed" path**

Remove the existing symlink first, then run the installer:

```bash
rm -f ~/.local/bin/carousel
bash carousel-builder/install.sh
```

Expected: detects the Claude Code plugin path and creates the symlink without cloning.

- [ ] **Step 4: Verify symlink still works**

```bash
carousel status
```

Expected: bridge status output.

- [ ] **Step 5: Commit**

```bash
git add carousel-builder/install.sh
git commit -m "feat(cli): standalone curl installer with sparse checkout fallback"
```

---

## Task 8: Update `open` skill to delegate to CLI

**Files:**
- Modify: `carousel-builder/skills/open/SKILL.md`

The `open` skill currently uses `nohup` + `lsof` directly. Now that the CLI exists, delegate to it.

- [ ] **Step 1: Update the skill**

Replace the content of `carousel-builder/skills/open/SKILL.md` with:

```markdown
---
name: open
description: >
  Use this skill when the user wants to open, start, or launch the carousel
  builder editor or HTTP bridge. Triggers on: "open carousel builder",
  "start carousel builder", "abrir carousel builder", "iniciar carousel builder",
  "open the editor", "launch carousel", "/open".

  <example>
  user: "open carousel builder"
  assistant: starts the HTTP bridge and opens the web editor
  </example>

  <example>
  user: "abrir o carousel builder"
  assistant: inicia o bridge HTTP e abre o editor
  </example>

  <example>
  user: "iniciar carousel builder"
  assistant: inicia o bridge HTTP e abre o editor no navegador
  </example>
argument-hint: "[stop]"
allowed-tools: [Bash]
---

# Open Carousel Builder

Start the HTTP bridge and open the web editor.

## Steps

1. If `stop` was passed as argument:
   ```bash
   carousel stop
   ```
   Report result and exit.

2. Start the bridge:
   ```bash
   carousel start
   ```

3. Report: "Carousel Builder aberto em `localhost:37776`."
   Mention that MCP tools remain always available in Claude Code regardless of the bridge.
```

- [ ] **Step 2: Smoke-test via skill path**

Run `carousel stop` first to ensure a clean state, then invoke the skill and confirm bridge starts.

```bash
carousel stop
```

Then ask Claude: "open carousel builder" — confirm the skill runs `carousel start` and reports the URL.

- [ ] **Step 3: Commit**

```bash
git add carousel-builder/skills/open/SKILL.md
git commit -m "refactor(cli): open skill delegates to carousel CLI"
```
