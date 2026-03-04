#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colours ──────────────────────────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo ""
echo -e "  ${BOLD}◆ clang-format studio${RESET}"
echo -e "  ${DIM}─────────────────────────────────────${RESET}"

# ── Check Node ───────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "  ${RED}✗ Node.js not found.${RESET} Install from https://nodejs.org"
  exit 1
fi
NODE_VER=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "  ${RED}✗ Node.js 18+ required${RESET} (found v${NODE_VER})"
  exit 1
fi
echo -e "  ${GREEN}✓${RESET} Node.js v${NODE_VER}"

# ── Check clang-format ────────────────────────────────────────────────────────
if ! command -v clang-format &>/dev/null; then
  echo -e "  ${YELLOW}⚠ clang-format not found in PATH${RESET}"
  echo -e "  ${DIM}  macOS:          brew install clang-format${RESET}"
  echo -e "  ${DIM}  Ubuntu/Debian:  sudo apt install clang-format${RESET}"
  echo -e "  ${DIM}  Windows:        https://releases.llvm.org/${RESET}"
  echo -e "  ${DIM}  Continuing — the app will show a warning in the UI.${RESET}"
else
  CF_VER=$(clang-format --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  echo -e "  ${GREEN}✓${RESET} clang-format ${CF_VER}"
fi

# ── Install dependencies if needed ───────────────────────────────────────────
if [ ! -d "$ROOT/node_modules" ]; then
  echo -e "  ${CYAN}→${RESET} Installing root dependencies…"
  (cd "$ROOT" && npm install --silent)
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo -e "  ${CYAN}→${RESET} Installing frontend dependencies…"
  (cd "$ROOT/frontend" && npm install --silent)
fi

echo -e "  ${DIM}─────────────────────────────────────${RESET}"
echo -e "  ${CYAN}→${RESET} Backend   ${DIM}http://localhost:3000${RESET}"
echo -e "  ${CYAN}→${RESET} Frontend  ${DIM}http://localhost:5173${RESET}"
echo -e "  ${DIM}─────────────────────────────────────${RESET}"
echo ""

# ── Launch both servers via concurrently ─────────────────────────────────────
cd "$ROOT"
exec npx concurrently \
  --kill-others-on-fail \
  --prefix-colors "cyan,magenta" \
  --names "server,vite" \
  "npx tsx watch server/index.ts" \
  "cd frontend && npm run dev"
