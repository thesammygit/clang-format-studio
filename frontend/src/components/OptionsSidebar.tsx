import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useStore } from '../store';
import type { OptionMeta } from '../api';

const ESSENTIAL_KEYS = new Set([
  'BasedOnStyle', 'ColumnLimit', 'IndentWidth', 'TabWidth', 'UseTab',
  'ContinuationIndentWidth', 'NamespaceIndentation', 'BreakBeforeBraces',
  'AllowShortFunctionsOnASingleLine', 'AllowShortIfStatementsOnASingleLine',
  'PointerAlignment', 'SpaceBeforeParens', 'SpacesInAngles',
  'AlignConsecutiveAssignments', 'BinPackArguments', 'BinPackParameters',
  'PackConstructorInitializers', 'BreakConstructorInitializers',
  'IncludeBlocks', 'SortIncludes', 'MaxEmptyLinesToKeep', 'CommentPragmas',
]);

// Control components

function BoolControl({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-studio-accent' : 'bg-studio-border'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function EnumControl({ value, values, onChange }: { value: string; values: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-studio-bg border border-studio-border text-studio-text text-xs rounded px-2 py-1 focus:outline-none focus:border-studio-accent"
    >
      {values.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
  );
}

function IntControl({ value, min = 0, max = 200, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={(e) => onChange(clamp(parseInt(e.target.value)))}
        className="flex-1"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={(e) => onChange(clamp(parseInt(e.target.value) || 0))}
        className="w-14 bg-studio-bg border border-studio-border text-studio-text text-xs rounded px-2 py-1 text-center focus:outline-none focus:border-studio-accent"
      />
    </div>
  );
}

function StringControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-studio-bg border border-studio-border text-studio-text text-xs rounded px-2 py-1 focus:outline-none focus:border-studio-accent font-mono"
    />
  );
}

function BraceWrappingControl({
  meta,
  value,
  onChange,
}: {
  meta: OptionMeta;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  if (!meta.flags) return null;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
      {Object.entries(meta.flags).map(([flag, flagMeta]) => {
        if (flagMeta.type === 'enum' && flagMeta.values) {
          return (
            <div key={flag} className="col-span-2">
              <label className="text-xs text-studio-muted mb-0.5 block">{flag}</label>
              <EnumControl
                value={(value?.[flag] ?? flagMeta.default) as string}
                values={flagMeta.values}
                onChange={(v) => onChange({ ...value, [flag]: v })}
              />
            </div>
          );
        }
        return (
          <label key={flag} className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={Boolean(value?.[flag] ?? flagMeta.default)}
              onChange={(e) => onChange({ ...value, [flag]: e.target.checked })}
              className="accent-studio-accent w-3 h-3"
            />
            <span className="text-xs text-studio-muted group-hover:text-studio-text transition-colors truncate" title={flagMeta.description}>
              {flag}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function OptionControl({ name, meta }: { name: string; meta: OptionMeta }) {
  const { config, defaults, updateOption } = useStore();
  const currentValue = config[name] ?? meta.default;
  const defaultValue = defaults[name] ?? meta.default;
  const isChanged = JSON.stringify(currentValue) !== JSON.stringify(defaultValue);

  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {isChanged && (
            <span className="w-1.5 h-1.5 rounded-full bg-studio-changed shrink-0" title="Changed from default" />
          )}
          <span
            className="text-xs text-studio-text font-mono cursor-help leading-tight"
            title={meta.description}
          >
            {name}
          </span>
        </div>
        {meta.type === 'bool' && (
          <BoolControl
            value={Boolean(currentValue)}
            onChange={(v) => updateOption(name, v)}
          />
        )}
      </div>

      {meta.type === 'enum' && (
        <EnumControl
          value={currentValue as string}
          values={meta.values ?? []}
          onChange={(v) => updateOption(name, v)}
        />
      )}
      {meta.type === 'int' && (
        <IntControl
          value={currentValue as number}
          min={meta.min}
          max={meta.max}
          onChange={(v) => updateOption(name, v)}
        />
      )}
      {meta.type === 'string' && (
        <StringControl
          value={currentValue as string}
          onChange={(v) => updateOption(name, v)}
        />
      )}
      {meta.type === 'BraceWrappingFlags' && (
        <div>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs text-studio-muted hover:text-studio-text transition-colors"
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {open ? 'collapse flags' : 'expand flags'}
          </button>
          {open && (
            <BraceWrappingControl
              meta={meta}
              value={(currentValue ?? {}) as Record<string, unknown>}
              onChange={(v) => updateOption(name, v)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category,
  entries,
}: {
  category: string;
  entries: [string, OptionMeta][];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-studio-muted hover:text-studio-text uppercase tracking-wider transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {category}
        </div>
        <span className="text-xs font-normal bg-studio-border text-studio-muted rounded-full px-1.5 py-0.5">
          {entries.length}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pt-1 pb-2 border-l border-studio-border ml-3">
          {entries.map(([name, meta]) => (
            <OptionControl key={name} name={name} meta={meta} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OptionsSidebar() {
  const { options, config } = useStore();
  const [viewMode, setViewMode] = useState<'essential' | 'all'>('essential');
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const entries = Object.entries(options);
    const filtered = entries.filter(([name, meta]) => {
      const matchesView = viewMode === 'all' || ESSENTIAL_KEYS.has(name);
      const q = search.toLowerCase();
      const matchesSearch = !q || name.toLowerCase().includes(q) || meta.category.toLowerCase().includes(q);
      return matchesView && matchesSearch;
    });

    const byCategory: Record<string, [string, OptionMeta][]> = {};
    for (const [name, meta] of filtered) {
      if (!byCategory[meta.category]) byCategory[meta.category] = [];
      byCategory[meta.category].push([name, meta]);
    }
    return byCategory;
  }, [options, viewMode, search, config]);

  const totalChanged = useMemo(() => {
    return Object.keys(options).filter((k) => {
      const cur = config[k];
      const def = options[k]?.default;
      return cur !== undefined && JSON.stringify(cur) !== JSON.stringify(def);
    }).length;
  }, [options, config]);

  return (
    <div className="flex flex-col h-full bg-studio-surface border-r border-studio-border">
      {/* Header controls */}
      <div className="px-3 py-2 border-b border-studio-border shrink-0 space-y-2">
        {/* Essential / All toggle */}
        <div className="flex gap-1 p-0.5 bg-studio-bg rounded">
          {(['essential', 'all'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-1 text-xs rounded capitalize transition-all ${
                viewMode === mode
                  ? 'bg-studio-accentDim text-studio-accent font-medium'
                  : 'text-studio-muted hover:text-studio-text'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-studio-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Filter options..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-studio-bg border border-studio-border text-studio-text text-xs rounded pl-6 pr-2 py-1.5 focus:outline-none focus:border-studio-accent placeholder-studio-muted"
          />
        </div>

        {/* Changed count */}
        {totalChanged > 0 && (
          <div className="text-xs text-studio-changed flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-studio-changed" />
            {totalChanged} option{totalChanged !== 1 ? 's' : ''} changed from default
          </div>
        )}
      </div>

      {/* Options list */}
      <div className="flex-1 overflow-y-auto py-2">
        {Object.entries(grouped).map(([category, entries]) => (
          <CategorySection key={category} category={category} entries={entries} />
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="px-4 py-8 text-xs text-studio-muted text-center">
            No options match your search.
          </div>
        )}
      </div>
    </div>
  );
}
