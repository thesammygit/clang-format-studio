# ◆ clang-format studio

An interactive configurator for `clang-format` with a live Monaco editor, diff view, and shareable URLs. Built for C++ style guide meetings.

![UI: liquid glass dark theme with options sidebar and Monaco editor](https://raw.githubusercontent.com/thesammygit/clang-format-studio/main/docs/preview.png)

---

## Features

- **Live formatting** — tweak any option and the code reformats instantly (300ms debounce)
- **Preset styles** — LLVM, Google, Chromium, Mozilla, WebKit — one click to load
- **Diff view** — Monaco side-by-side diff of original vs formatted output
- **Essential / All toggle** — shows the 20 most-tweaked options by default, or all ~90
- **Export** — downloads a ready-to-use `.clang-format` file
- **Load config** — drag in any existing `.clang-format` to populate the UI
- **Shareable URLs** — full config is base64-encoded in the `?c=` query param
- **Keyboard shortcut** — `Cmd/Ctrl+S` to force reformat

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | 18 or newer |
| clang-format | any version in PATH |

### Install clang-format

```bash
# macOS
brew install clang-format

# Ubuntu / Debian
sudo apt install clang-format

# Arch
sudo pacman -S clang

# Windows — download the LLVM installer from https://releases.llvm.org/
# Make sure to tick "Add to PATH" during install
```

---

## Quick start

```bash
git clone https://github.com/thesammygit/clang-format-studio
cd clang-format-studio
./start.sh
```

The script will:
1. Verify Node.js 18+ and clang-format are available
2. Run `npm install` in both root and `frontend/` if needed
3. Start the Express backend on **:3000** and Vite on **:5173**

Then open **http://localhost:5173**

---

## Manual start

If you prefer running things separately:

```bash
# Install dependencies (first time only)
npm install
cd frontend && npm install && cd ..

# Start both servers together
npm run dev

# Or individually
npm run dev:server    # Express backend on :3000
npm run dev:frontend  # Vite dev server on :5173
```

---

## Project structure

```
clang-format-studio/
├── start.sh                  ← one-command launcher
├── server/
│   ├── index.ts              Express backend — /version /options /defaults /format
│   └── options.json          ~90 clang-format option definitions
├── frontend/
│   └── src/
│       ├── App.tsx            Layout, URL state, Cmd+S shortcut, resize
│       ├── store.ts           Zustand global state
│       ├── api.ts             Typed fetch wrappers
│       └── components/
│           ├── TopBar.tsx     Logo, presets, export/load, version badge
│           ├── OptionsSidebar.tsx  Controls, search, category sections
│           └── CodePanel.tsx  Monaco editor + diff view
└── package.json
```

---

## API

The backend exposes four endpoints (all proxied through Vite in dev):

| Endpoint | Description |
|---|---|
| `GET /version` | Returns `{ version, available }` |
| `GET /options` | Returns all option metadata from `options.json` |
| `GET /defaults?style=LLVM` | Runs `clang-format --dump-config --style=X`, returns parsed JSON |
| `POST /format` | Body: `{ code, config }` — returns `{ formatted }` or `{ error }` |

---

## Tech stack

**Backend** — Node.js · Express · TypeScript (`tsx`) · `js-yaml`

**Frontend** — Vite · React 18 · TypeScript · Tailwind CSS v3 · Monaco Editor · Zustand · Sonner

---

*Inspired by [zed0/clang-format-configurator](https://github.com/zed0/clang-format-configurator) (MIT)*
