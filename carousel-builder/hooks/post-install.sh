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
