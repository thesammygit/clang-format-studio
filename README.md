# clang-format studio

A beautiful, interactive configurator for `clang-format` — built for C++ style guide meetings and sharing configs with your team.

## Features

- **Live formatting** — edit code or options, see results instantly
- **Preset styles** — LLVM, Google, Chromium, Mozilla, WebKit
- **Diff view** — Monaco side-by-side diff of original vs formatted
- **Export / Import** — download or upload `.clang-format` files
- **Shareable URLs** — config encoded in `?c=` query param
- **~80 options** — categorized, searchable, with Essential/All view toggle
- **Keyboard shortcut** — `Cmd/Ctrl+S` to reformat

## Requirements

- **Node.js 18+**
- **clang-format** installed and in PATH

```bash
# macOS
brew install clang-format

# Ubuntu/Debian
sudo apt install clang-format

# Windows — install LLVM from https://releases.llvm.org/
```

## Getting started

```bash
git clone https://github.com/your-username/clang-format-studio
cd clang-format-studio
npm install
cd frontend && npm install && cd ..
npm run dev
```

Then open **http://localhost:5173**

## Project structure

```
cppFormatViewer/
├── server/
│   ├── index.ts          Express backend (~80 lines)
│   └── options.json      clang-format option metadata
├── frontend/
│   └── src/
│       ├── App.tsx        Layout, URL state, keyboard shortcuts
│       ├── store.ts       Zustand state
│       ├── api.ts         Fetch wrappers
│       └── components/
│           ├── TopBar.tsx
│           ├── OptionsSidebar.tsx
│           └── CodePanel.tsx
└── package.json
```

## Tech stack

**Backend:** Node.js · Express · TypeScript · js-yaml
**Frontend:** Vite · React 18 · TypeScript · Tailwind CSS · Monaco Editor · Zustand · Sonner

---

*Inspired by [zed0/clang-format-configurator](https://github.com/zed0/clang-format-configurator) (MIT)*
