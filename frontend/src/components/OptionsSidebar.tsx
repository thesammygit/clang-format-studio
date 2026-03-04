import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
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

// ─── Control components ───────────────────────────────────────────────────

function BoolControl({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 34,
        height: 18,
        borderRadius: 9,
        background: value ? 'rgba(170,205,255,0.22)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${value ? 'rgba(170,205,255,0.38)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: value
          ? '0 0 10px rgba(170,205,255,0.12) inset'
          : '0 2px 6px rgba(0,0,0,0.25) inset',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: 6,
          background: value ? 'rgba(170,205,255,0.95)' : 'rgba(255,255,255,0.45)',
          left: value ? 'calc(100% - 14px)' : '2px',
          boxShadow: value
            ? '0 0 8px rgba(170,205,255,0.5)'
            : '0 1px 3px rgba(0,0,0,0.4)',
          transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </button>
  );
}

function EnumControl({ value, values, onChange }: { value: string; values: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.72)',
        background: 'rgba(0,0,0,0.28)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '5px 26px 5px 9px',
        cursor: 'pointer',
        outline: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25) inset',
        transition: 'border-color 0.15s',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(170,205,255,0.3)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    >
      {values.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
  );
}

function IntControl({ value, min = 0, max = 200, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={(e) => onChange(clamp(parseInt(e.target.value)))}
        style={{ '--fill': `${pct}%` } as React.CSSProperties}
        className="flex-1"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={(e) => onChange(clamp(parseInt(e.target.value) || 0))}
        style={{
          width: 48,
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.72)',
          background: 'rgba(0,0,0,0.28)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '7px',
          padding: '4px 6px',
          textAlign: 'center',
          outline: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25) inset',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(170,205,255,0.3)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
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
      style={{
        width: '100%',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.72)',
        background: 'rgba(0,0,0,0.28)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '5px 9px',
        outline: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25) inset',
        transition: 'border-color 0.15s',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(170,205,255,0.3)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    />
  );
}

function BraceWrappingControl({
  meta, value, onChange,
}: {
  meta: OptionMeta;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  if (!meta.flags) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 16px',
        marginTop: 8,
        padding: '10px 12px',
        background: 'rgba(0,0,0,0.18)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {Object.entries(meta.flags).map(([flag, flagMeta]) => {
        if (flagMeta.type === 'enum' && flagMeta.values) {
          return (
            <div key={flag} style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{flag}</div>
              <EnumControl
                value={(value?.[flag] ?? flagMeta.default) as string}
                values={flagMeta.values}
                onChange={(v) => onChange({ ...value, [flag]: v })}
              />
            </div>
          );
        }
        return (
          <label
            key={flag}
            className="flex items-center gap-2 cursor-pointer group"
            title={flagMeta.description}
          >
            <input
              type="checkbox"
              checked={Boolean(value?.[flag] ?? flagMeta.default)}
              onChange={(e) => onChange({ ...value, [flag]: e.target.checked })}
              style={{ accentColor: 'rgba(170,205,255,0.9)', width: 12, height: 12, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{flag}</span>
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
  const [braceOpen, setBraceOpen] = useState(false);

  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        marginBottom: 2,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isChanged && (
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--changed)',
                boxShadow: '0 0 6px rgba(255,178,95,0.5)',
                flexShrink: 0,
                display: 'inline-block',
              }}
              title="Changed from default"
            />
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: isChanged ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.52)',
              letterSpacing: '0.01em',
              cursor: 'default',
            }}
            title={meta.description}
          >
            {name}
          </span>
        </div>
        {meta.type === 'bool' && (
          <BoolControl value={Boolean(currentValue)} onChange={(v) => updateOption(name, v)} />
        )}
      </div>

      {/* Control */}
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
        <StringControl value={currentValue as string} onChange={(v) => updateOption(name, v)} />
      )}
      {meta.type === 'BraceWrappingFlags' && (
        <>
          <button
            onClick={() => setBraceOpen(!braceOpen)}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <span style={{ fontSize: 9, display: 'inline-block', transform: braceOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
            {braceOpen ? 'collapse' : 'expand flags'}
          </button>
          {braceOpen && (
            <BraceWrappingControl
              meta={meta}
              value={(currentValue ?? {}) as Record<string, unknown>}
              onChange={(v) => updateOption(name, v)}
            />
          )}
        </>
      )}
    </div>
  );
}

function CategorySection({ category, entries }: { category: string; entries: [string, OptionMeta][] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3"
        style={{
          padding: '10px 14px 6px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              display: 'inline-block',
              width: 10,
              fontSize: 8,
              color: 'rgba(255,255,255,0.18)',
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          >▶</span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.22)',
              textTransform: 'uppercase',
            }}
          >
            {category}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.15)',
          }}
        >
          {entries.length}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 4px' }}>
          {entries.map(([name, meta]) => (
            <OptionControl key={name} name={name} meta={meta} />
          ))}
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '4px 14px 0' }} />
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
  }, [options, viewMode, search]);

  const totalChanged = useMemo(() => {
    return Object.keys(options).filter((k) => {
      const cur = config[k];
      const def = options[k]?.default;
      return cur !== undefined && JSON.stringify(cur) !== JSON.stringify(def);
    }).length;
  }, [options, config]);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {(['essential', 'all'] as const).map((mode) => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'rgba(170,205,255,0.88)' : 'rgba(255,255,255,0.28)',
                  background: isActive ? 'rgba(170,205,255,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(170,205,255,0.2)' : '1px solid transparent',
                  borderRadius: 7,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.18s ease',
                  letterSpacing: '0.01em',
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={11}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.2)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="filter options…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.65)',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 9,
              padding: '6px 10px 6px 28px',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(170,205,255,0.25)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
          />
        </div>

        {/* Changed count */}
        {totalChanged > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '11px',
              color: 'var(--changed)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 400,
            }}
          >
            <span
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'var(--changed)',
                boxShadow: '0 0 6px rgba(255,178,95,0.45)',
                display: 'inline-block', flexShrink: 0,
              }}
            />
            {totalChanged} changed
          </div>
        )}
      </div>

      {/* Options list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {Object.entries(grouped).map(([category, entries]) => (
          <CategorySection key={category} category={category} entries={entries} />
        ))}
        {Object.keys(grouped).length === 0 && (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            No options match.
          </div>
        )}
      </div>
    </div>
  );
}
