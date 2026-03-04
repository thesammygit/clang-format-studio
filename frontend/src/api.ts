export interface VersionInfo {
  version?: string;
  available: boolean;
  raw?: string;
}

export interface OptionMeta {
  type: 'bool' | 'int' | 'enum' | 'string' | 'BraceWrappingFlags';
  category: string;
  description: string;
  default?: unknown;
  essential?: boolean;
  min?: number;
  max?: number;
  values?: string[];
  dependsOn?: Record<string, string>;
  flags?: Record<string, {
    default: unknown;
    description: string;
    type?: string;
    values?: string[];
  }>;
}

export type OptionsMetadata = Record<string, OptionMeta>;

export async function getVersion(): Promise<VersionInfo> {
  const res = await fetch('/version');
  return res.json();
}

export async function getOptions(): Promise<OptionsMetadata> {
  const res = await fetch('/options');
  return res.json();
}

export async function getDefaults(style: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/defaults?style=${encodeURIComponent(style)}`);
  if (!res.ok) throw new Error('Failed to load defaults');
  return res.json();
}

export async function formatCode(
  code: string,
  config: Record<string, unknown>
): Promise<{ formatted?: string; error?: string }> {
  const res = await fetch('/format', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, config }),
  });
  return res.json();
}
