import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useStore } from './store';
import { getVersion, getOptions, getDefaults, formatCode } from './api';
import { TopBar } from './components/TopBar';
import { OptionsSidebar } from './components/OptionsSidebar';
import { CodePanel } from './components/CodePanel';

const MIN_SIDEBAR_W = 240;
const MAX_SIDEBAR_W = 520;
const DEFAULT_SIDEBAR_W = 296;

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

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const [versionInfo, optionsMeta] = await Promise.all([getVersion(), getOptions()]);
      setVersion(versionInfo.version ?? '', versionInfo.available);
      setOptions(optionsMeta);

      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('c');
      if (encoded) {
        try {
          const decoded = JSON.parse(atob(encoded)) as Record<string, unknown>;
          setConfig(decoded);
          setDefaults(decoded);
          toast.info('Config loaded from URL');
          return;
        } catch {
          toast.error('Could not decode URL config');
        }
      }

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

  // ── Format (debounced) ───────────────────────────────────────────────────
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
    debounceRef.current = setTimeout(() => runFormat(originalCode, config), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [config, originalCode, runFormat]);

  // ── URL state ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Object.keys(config).length === 0) return;
    const encoded = btoa(JSON.stringify(config));
    const url = new URL(window.location.href);
    url.searchParams.set('c', encoded);
    window.history.replaceState({}, '', url.toString());
  }, [config]);

  // ── Cmd+S shortcut ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        runFormat(originalCode, config);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [originalCode, config, runFormat]);

  // ── Preset load ──────────────────────────────────────────────────────────
  const handlePresetLoad = useCallback((newConfig: Record<string, unknown>, _preset: string) => {
    setDefaults(newConfig);
    setConfig(newConfig);
  }, [setDefaults, setConfig]);

  // ── Sidebar resize ───────────────────────────────────────────────────────
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
      setSidebarW(Math.max(MIN_SIDEBAR_W, Math.min(MAX_SIDEBAR_W, dragStartW.current + delta)));
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
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(10,14,22,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.78)',
            fontFamily: 'var(--font-ui)',
            fontSize: '12.5px',
            borderRadius: '12px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          },
        }}
      />

      <TopBar onPresetLoad={handlePresetLoad} />

      {/* Main content — floating glass panels */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          padding: '8px',
          gap: 0,
        }}
      >
        {/* Sidebar panel */}
        <div
          className="glass rounded-2xl overflow-hidden flex-shrink-0"
          style={{ width: sidebarW, minWidth: MIN_SIDEBAR_W, maxWidth: MAX_SIDEBAR_W }}
        >
          <OptionsSidebar />
        </div>

        {/* Resize handle — invisible hitbox, hairline on hover */}
        <div
          onMouseDown={onMouseDownDivider}
          style={{
            width: 12,
            flexShrink: 0,
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 1,
              height: '40%',
              borderRadius: 1,
              background: 'rgba(255,255,255,0.08)',
              transition: 'opacity 0.2s, height 0.2s',
            }}
          />
        </div>

        {/* Code panel */}
        <div className="glass rounded-2xl overflow-hidden flex-1">
          <CodePanel />
        </div>
      </div>

      {/* Footer credit */}
      <div
        style={{
          textAlign: 'center',
          padding: '4px 0 6px',
          fontFamily: 'var(--font-ui)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.1)',
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}
      >
        Inspired by{' '}
        <a
          href="https://github.com/zed0/clang-format-configurator"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'rgba(255,255,255,0.18)', textDecoration: 'none' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.38)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.18)'; }}
        >
          zed0/clang-format-configurator
        </a>
        {' '}(MIT)
      </div>
    </div>
  );
}
