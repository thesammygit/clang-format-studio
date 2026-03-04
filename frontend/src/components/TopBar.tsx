import React, { useRef } from 'react';
import { Download, Upload, Braces } from 'lucide-react';
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
      toast.success(`Loaded ${preset} preset`);
    } catch {
      toast.error(`Failed to load ${preset} preset`);
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
    toast.success('Downloaded .clang-format');
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
        toast.error('Failed to parse .clang-format file');
      }
    };
    reader.readAsText(file);
    // reset so the same file can be re-loaded
    e.target.value = '';
  }

  return (
    <div className="flex items-center gap-4 px-4 h-12 bg-studio-surface border-b border-studio-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <Braces size={18} className="text-studio-accent" />
        <span className="text-studio-text font-semibold tracking-tight text-sm">
          clang-format{' '}
          <span className="text-studio-accent" style={{ textShadow: '0 0 12px rgba(56,139,253,0.6)' }}>
            studio
          </span>
        </span>
      </div>

      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className={`px-2.5 py-1 text-xs rounded border transition-all ${
              activePreset === p
                ? 'bg-studio-accentDim border-studio-accent text-studio-accent'
                : 'bg-transparent border-studio-border text-studio-muted hover:border-studio-accent hover:text-studio-text'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1 text-xs rounded border border-studio-border text-studio-muted hover:border-studio-accent hover:text-studio-text transition-all"
      >
        <Upload size={13} />
        Load config
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
        className="flex items-center gap-1.5 px-3 py-1 text-xs rounded border border-studio-accent text-studio-accent hover:bg-studio-accentDim transition-all"
      >
        <Download size={13} />
        Export .clang-format
      </button>

      {/* Version badge */}
      <div
        className={`px-2 py-0.5 text-xs rounded-full border font-mono ${
          versionAvailable
            ? 'border-emerald-700 text-emerald-400 bg-emerald-950/50'
            : 'border-red-800 text-red-400 bg-red-950/50'
        }`}
      >
        {versionAvailable ? `clang-format ${version}` : 'clang-format not found'}
      </div>
    </div>
  );
}
