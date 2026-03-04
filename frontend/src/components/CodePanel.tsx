import Editor, { DiffEditor } from '@monaco-editor/react';
import { useStore } from '../store';

const MONACO_OPTIONS = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on' as const,
  renderLineHighlight: 'gutter' as const,
  smoothScrolling: true,
  cursorBlinking: 'smooth' as const,
  padding: { top: 12, bottom: 12 },
  wordWrap: 'off' as const,
};

export function CodePanel() {
  const {
    originalCode,
    formattedCode,
    viewMode,
    isFormatting,
    setOriginalCode,
    setViewMode,
  } = useStore();

  const displayCode = viewMode === 'formatted' ? (formattedCode || originalCode) : originalCode;

  return (
    <div className="flex flex-col h-full bg-studio-bg">
      {/* Tab bar */}
      <div className="flex items-center border-b border-studio-border shrink-0 bg-studio-surface">
        {(['formatted', 'diff'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 text-xs capitalize transition-all border-b-2 ${
              viewMode === mode
                ? 'border-studio-accent text-studio-accent bg-studio-accentDim/30'
                : 'border-transparent text-studio-muted hover:text-studio-text'
            }`}
          >
            {mode === 'diff' ? 'Diff' : 'Formatted'}
          </button>
        ))}

        {isFormatting && (
          <div className="ml-auto mr-3 flex items-center gap-2 text-xs text-studio-muted">
            <span className="inline-block w-3 h-3 border-2 border-studio-accent border-t-transparent rounded-full animate-spin" />
            reformatting…
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Reformatting overlay */}
        {isFormatting && (
          <div className="absolute inset-0 z-10 pointer-events-none bg-studio-bg/30 backdrop-blur-[1px] transition-opacity" />
        )}

        {viewMode === 'formatted' ? (
          <Editor
            height="100%"
            language="cpp"
            theme="vs-dark"
            value={displayCode}
            onChange={(val) => {
              if (val !== undefined) setOriginalCode(val);
            }}
            options={MONACO_OPTIONS}
          />
        ) : (
          <DiffEditor
            height="100%"
            language="cpp"
            theme="vs-dark"
            original={originalCode}
            modified={formattedCode || originalCode}
            options={{
              ...MONACO_OPTIONS,
              readOnly: true,
              renderSideBySide: true,
              enableSplitViewResizing: true,
            }}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="h-6 flex items-center px-3 gap-4 border-t border-studio-border bg-studio-surface shrink-0">
        <span className="text-xs text-studio-muted font-mono">
          {viewMode === 'formatted'
            ? `${displayCode.split('\n').length} lines`
            : `Diff: original ↔ formatted`}
        </span>
        {viewMode === 'formatted' && formattedCode && (
          <span className="text-xs text-emerald-500 ml-auto">
            ✓ formatted
          </span>
        )}
      </div>
    </div>
  );
}
