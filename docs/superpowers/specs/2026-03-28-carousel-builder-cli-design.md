# Carousel Builder CLI — Design Spec

**Date:** 2026-03-28
**Status:** Approved

## Problem

The carousel builder HTTP bridge is started with `node <plugin-root>/server/mcp-server.js`, requiring the user to know the plugin's absolute path. There is no ergonomic way to manage the bridge lifecycle (start, stop, status, logs) from an arbitrary working directory.

## Goal

A `carousel` CLI command that manages the HTTP bridge from any directory. Installed automatically by the plugin or via a standalone curl installer from GitHub.

## Architecture

Three new files added to the plugin:

```
carousel-builder/
  bin/
    carousel.js        ← Node.js CLI entry point (shebang)
  install.sh           ← standalone curl installer
  hooks/
    post-install.sh    ← Claude Code plugin hook
```

The CLI resolves the server path via `import.meta.url` — no env vars or CWD dependency. The only artifact installed outside the plugin folder is a symlink at `~/.local/bin/carousel`.

## Commands

| Command           | Behavior |
|-------------------|----------|
| `carousel start`  | Starts the bridge in background. Saves PID to `/tmp/carousel-bridge.pid`. Opens `http://localhost:37776` in the browser. No-ops if already running. |
| `carousel stop`   | Reads PID file, sends SIGTERM, removes PID file. |
| `carousel status` | Reports running/stopped, PID, port, approximate uptime. |
| `carousel logs`   | Tails `/tmp/carousel-bridge.log` in real time. |

No external CLI framework. `process.argv[2]` is sufficient for 4 subcommands.

The bridge is spawned with `detached: true` and `stdio: ['ignore', logFileStream, logFileStream]`, writing logs to `/tmp/carousel-bridge.log`.

## Installation

### Via Claude Code plugin (automatic)

`hooks/post-install.sh` runs on plugin install:
1. Creates `~/.local/bin/` if missing
2. Creates symlink: `~/.local/bin/carousel → <plugin-root>/bin/carousel.js`
3. Warns if `~/.local/bin` is not in PATH

### Via curl (standalone)

```bash
curl -fsSL https://raw.githubusercontent.com/<user>/orionlabz/main/carousel-builder/install.sh | bash
```

`install.sh`:
1. Checks if plugin is already installed via Claude Code (avoids duplicating)
2. If not: sparse-checks out only `carousel-builder/` from the repo
3. Creates the same symlink as the plugin hook

### Uninstall

```bash
carousel stop && rm ~/.local/bin/carousel
```

## Out of Scope

- Publishing to npm
- Generating carousels directly from the CLI (that remains a Claude tool)
- Windows support (PATH mechanics differ; tracked as future work)
