import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useStore } from './store';
import { getVersion, getOptions, getDefaults, formatCode } from './api';
import { TopBar } from './components/TopBar';
import { OptionsSidebar } from './components/OptionsSidebar';
import { CodePanel } from './components/CodePanel';

const MIN_SIDEBAR_W = 240;
const MAX_SIDEBAR_W = 520;
const DEFAULT_SIDEBAR_W = 300;

export default function App() {
  const {
    config, originalCode,
    setConfig, setDefaults, setOptions, setVersion,
    setFormattedCode, setIsFormatting,
  } = useStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sidebarW, setSidebarW] = useState(DEFAULT_SIDEBAR_W);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  // ── Init: load version + options + LLVM defaults ──────────────────────────
  useEffect(() => {
    async function init() {
      const [versionInfo, optionsMeta] = await Promise.all([
        getVersion(),
        getOptions(),
      ]);
      setVersion(versionInfo.version ?? '', versionInfo.available);
      setOptions(optionsMeta);

      // Check URL for shared config
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('c');
      if (encoded) {
        try {
          const decoded = JSON.parse(atob(encoded)) as Record<string, unknown>;
          setConfig(decoded);
          setDefaults(decoded);
          toast.info('Loaded config from URL');
          return;
        } catch {
          toast.error('Failed to decode URL config');
        }
      }

      // Load LLVM defaults
      try {
        const defaults = await getDefaults('LLVM');
        setDefaults(defaults);
        setConfig(defaults);
      } catch {
        toast.error('Could not load LLVM defaults');
      }
    }
    init();
  }, []);

  // ── Auto-reformat on config or code change (debounced) ───────────────────
  const runFormat = useCallback(async (code: string, cfg: Record<string, unknown>) => {
    if (!code.trim() || Object.keys(cfg).length === 0) return;
    setIsFormatting(true);
    try {
      const result = await formatCode(code, cfg);
      if (result.formatted !== undefined) {
        setFormattedCode(result.formatted);
      } else if (result.error) {
        toast.error(`Format error: ${result.error}`);
      }
    } catch {
      toast.error('Server error — is the backend running?');
    } finally {
      setIsFormatting(false);
    }
  }, [setIsFormatting, setFormattedCode]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runFormat(originalCode, config);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [config, originalCode, runFormat]);

  // ── Update URL state on config change ────────────────────────────────────
  useEffect(() => {
    if (Object.keys(config).length === 0) return;
    const encoded = btoa(JSON.stringify(config));
    const url = new URL(window.location.href);
    url.searchParams.set('c', encoded);
    window.history.replaceState({}, '', url.toString());
  }, [config]);

  // ── Keyboard shortcut: Cmd/Ctrl+S → reformat ─────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        runFormat(originalCode, config);
        toast.info('Reformatting…', { duration: 800 });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [originalCode, config, runFormat]);

  // ── Preset load handler ───────────────────────────────────────────────────
  const handlePresetLoad = useCallback((newConfig: Record<string, unknown>, _preset: string) => {
    setDefaults(newConfig);
    setConfig(newConfig);
  }, [setDefaults, setConfig]);

  // ── Sidebar resize drag ───────────────────────────────────────────────────
  const onMouseDownDivider = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = sidebarW;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newW = Math.max(MIN_SIDEBAR_W, Math.min(MAX_SIDEBAR_W, dragStartW.current + delta));
      setSidebarW(newW);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-studio-bg text-studio-text overflow-hidden">
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#161b22',
            border: '1px solid #30363d',
            color: '#e6edf3',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
          },
        }}
      />

      <TopBar onPresetLoad={handlePresetLoad} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div style={{ width: sidebarW, minWidth: MIN_SIDEBAR_W, maxWidth: MAX_SIDEBAR_W }} className="flex-shrink-0 overflow-hidden">
          <OptionsSidebar />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={onMouseDownDivider}
          className="w-1 bg-studio-border hover:bg-studio-accent cursor-col-resize transition-colors shrink-0 relative"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Code panel */}
        <div className="flex-1 overflow-hidden">
          <CodePanel />
        </div>
      </div>

      {/* Footer */}
      <div className="h-5 flex items-center justify-end px-3 bg-studio-surface border-t border-studio-border shrink-0">
        <span className="text-xs text-studio-muted">
          Inspired by{' '}
          <a
            href="https://github.com/zed0/clang-format-configurator"
            target="_blank"
            rel="noreferrer"
            className="hover:text-studio-text underline"
          >
            zed0/clang-format-configurator
          </a>
          {' '}(MIT)
        </span>
      </div>
    </div>
  );
}
