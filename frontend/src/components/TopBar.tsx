import { useRef } from 'react';
import { ArrowDownToLine, FolderOpen } from 'lucide-react';
import * as yaml from 'js-yaml';
import { toast } from 'sonner';
import { useStore } from '../store';
import { getDefaults } from '../api';

const PRESETS = ['LLVM', 'Google', 'Chromium', 'Mozilla', 'WebKit'] as const;

interface TopBarProps {
  onPresetLoad: (config: Record<string, unknown>, preset: string) => void;
}

export function TopBar({ onPresetLoad }: TopBarProps) {
  const { version, versionAvailable, config, activePreset, setActivePreset } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePreset(preset: string) {
    try {
      const defaults = await getDefaults(preset);
      setActivePreset(preset);
      onPresetLoad(defaults, preset);
      toast.success(`${preset} preset loaded`);
    } catch {
      toast.error(`Failed to load ${preset}`);
    }
  }

  function handleExport() {
    const content = '---\n' + yaml.dump(config, { lineWidth: -1 });
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.clang-format';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('.clang-format exported');
  }

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = yaml.load(ev.target?.result as string) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          onPresetLoad(parsed, 'Custom');
          setActivePreset('Custom');
          toast.success(`Loaded ${file.name}`);
        }
      } catch {
        toast.error('Could not parse config file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div
      className="glass mx-2 mt-2 rounded-2xl shrink-0 flex items-center px-5 h-12 gap-6"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono shrink-0"
          style={{
            background: 'rgba(170,205,255,0.12)',
            border: '1px solid rgba(170,205,255,0.25)',
            color: 'rgba(170,205,255,0.9)',
            boxShadow: '0 0 10px rgba(170,205,255,0.12) inset',
          }}
        >
          ◆
        </div>
        <span className="font-ui text-sm font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>
          clang-format{' '}
          <span style={{ color: 'rgba(255,255,255,0.36)', fontWeight: 300 }}>studio</span>
        </span>
      </div>

      {/* Hairline divider */}
      <div className="h-4 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Preset tabs */}
      <div className="flex items-center gap-0.5">
        {PRESETS.map((p) => {
          const isActive = activePreset === p;
          return (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '12px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'rgba(170,205,255,0.9)' : 'rgba(255,255,255,0.32)',
                background: isActive ? 'rgba(170,205,255,0.08)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(170,205,255,0.2)' : 'transparent',
                borderRadius: '8px',
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.58)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.32)';
                }
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Version */}
      <div
        className="font-mono text-[10px] tracking-wide shrink-0"
        style={{
          color: versionAvailable ? 'rgba(130,210,160,0.7)' : 'rgba(255,120,120,0.6)',
          letterSpacing: '0.04em',
        }}
      >
        {versionAvailable ? `v${version}` : 'not found'}
      </div>

      {/* Hairline divider */}
      <div className="h-4 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 transition-all"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '11.5px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.38)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '5px 10px',
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.16)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <FolderOpen size={12} strokeWidth={1.5} />
          Load
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".clang-format,.yaml,.yml"
          className="hidden"
          onChange={handleFileLoad}
        />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 transition-all"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '11.5px',
            fontWeight: 500,
            color: 'rgba(170,205,255,0.8)',
            background: 'rgba(170,205,255,0.07)',
            border: '1px solid rgba(170,205,255,0.2)',
            borderRadius: '8px',
            padding: '5px 10px',
            cursor: 'pointer',
            letterSpacing: '0.01em',
            boxShadow: '0 0 12px rgba(170,205,255,0.06) inset',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(170,205,255,0.12)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(170,205,255,0.35)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(170,205,255,0.07)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(170,205,255,0.2)';
          }}
        >
          <ArrowDownToLine size={12} strokeWidth={1.5} />
          Export
        </button>
      </div>
    </div>
  );
}
