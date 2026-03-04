import Editor, { DiffEditor } from '@monaco-editor/react';
import type * as MonacoType from 'monaco-editor';
import { useStore } from '../store';

const MONACO_OPTIONS: MonacoType.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'gutter',
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  padding: { top: 16, bottom: 16 },
  wordWrap: 'off',
  scrollbar: {
    verticalScrollbarSize: 3,
    horizontalScrollbarSize: 3,
    useShadows: false,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  lineDecorationsWidth: 4,
  lineNumbersMinChars: 3,
};

function handleBeforeMount(monaco: typeof MonacoType) {
  monaco.editor.defineTheme('obsidian-glass', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '3d5070', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7eb8f7' },
      { token: 'string', foreground: '7ecba0' },
      { token: 'number', foreground: 'e0c080' },
      { token: 'type', foreground: 'a8c4e8' },
      { token: 'delimiter', foreground: '3d5580' },
    ],
    colors: {
      'editor.background': '#05070c',
      'editor.foreground': '#c8d8ec',
      'editor.lineHighlightBackground': '#ffffff06',
      'editor.selectionBackground': '#2a4a7a50',
      'editor.inactiveSelectionBackground': '#2a4a7a28',
      'editorGutter.background': '#05070c',
      'editorLineNumber.foreground': '#ffffff18',
      'editorLineNumber.activeForeground': '#ffffff38',
      'editorCursor.foreground': '#aaccff',
      'editorIndentGuide.background': '#ffffff08',
      'editorIndentGuide.activeBackground': '#ffffff14',
      'diffEditor.insertedTextBackground': '#1a4a2a30',
      'diffEditor.removedTextBackground': '#4a1a1a30',
      'diffEditorGutter.insertedLineBackground': '#1a4a2a20',
      'diffEditorGutter.removedLineBackground': '#4a1a1a20',
    },
  });
}

const TAB_LABELS = { formatted: 'Formatted', diff: 'Diff' } as const;

export function CodePanel() {
  const {
    originalCode, formattedCode, viewMode,
    isFormatting, setOriginalCode, setViewMode,
  } = useStore();

  const displayCode = viewMode === 'formatted' ? (formattedCode || originalCode) : originalCode;

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          height: 40,
          flexShrink: 0,
          background: 'rgba(0,0,0,0.12)',
        }}
      >
        {(['formatted', 'diff'] as const).map((mode) => {
          const isActive = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '12px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'rgba(170,205,255,0.85)' : 'rgba(255,255,255,0.28)',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '1px solid rgba(170,205,255,0.5)' : '1px solid transparent',
                padding: '0 14px',
                height: '100%',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.15s ease',
                marginBottom: -1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)';
              }}
            >
              {TAB_LABELS[mode]}
            </button>
          );
        })}

        {/* Reformatting indicator */}
        {isFormatting && (
          <div
            className="ml-auto flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.02em',
            }}
          >
            <span
              className="animate-spin-slow"
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '1.5px solid rgba(170,205,255,0.15)',
                borderTopColor: 'rgba(170,205,255,0.7)',
              }}
            />
            formatting
          </div>
        )}

        {/* Line count / diff label */}
        {!isFormatting && (
          <div
            className="ml-auto"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.15)',
              letterSpacing: '0.04em',
            }}
          >
            {viewMode === 'formatted'
              ? `${displayCode.split('\n').length} lines`
              : 'original ↔ formatted'}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        {isFormatting && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(5,7,12,0.4)',
              backdropFilter: 'blur(2px)',
              pointerEvents: 'none',
              transition: 'opacity 0.2s',
            }}
          />
        )}

        {viewMode === 'formatted' ? (
          <Editor
            height="100%"
            language="cpp"
            theme="obsidian-glass"
            value={displayCode}
            beforeMount={handleBeforeMount}
            onChange={(val) => { if (val !== undefined) setOriginalCode(val); }}
            options={MONACO_OPTIONS}
          />
        ) : (
          <DiffEditor
            height="100%"
            language="cpp"
            theme="obsidian-glass"
            original={originalCode}
            modified={formattedCode || originalCode}
            beforeMount={handleBeforeMount}
            options={{
              ...MONACO_OPTIONS,
              readOnly: true,
              renderSideBySide: true,
              enableSplitViewResizing: true,
            }}
          />
        )}
      </div>
    </div>
  );
}
