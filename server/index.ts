import express from 'express';
import cors from 'cors';
import { execSync, spawnSync } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as yaml from 'js-yaml';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = 3000;

// Detect clang-format binary cross-platform (no user input involved)
function findClangFormat(): string | null {
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('where', ['clang-format'], { encoding: 'utf8' });
      return r.stdout?.split('\n')[0]?.trim() || null;
    } else {
      const r = spawnSync('which', ['clang-format'], { encoding: 'utf8' });
      return r.stdout?.trim() || null;
    }
  } catch {
    return null;
  }
}

const CLANG_FORMAT_BIN = findClangFormat() || 'clang-format';

// GET /version
app.get('/version', (_req, res) => {
  // Use spawnSync — no shell, no user input
  const result = spawnSync(CLANG_FORMAT_BIN, ['--version'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    return res.json({ available: false });
  }
  const raw = result.stdout.trim();
  const match = raw.match(/version\s+([\d.]+)/);
  const version = match ? match[1] : raw;
  res.json({ version, available: true, raw });
});

// GET /options
app.get('/options', (_req, res) => {
  const optionsPath = join(__dirname, 'options.json');
  try {
    const data = JSON.parse(readFileSync(optionsPath, 'utf8'));
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Could not load options.json' });
  }
});

// GET /defaults?style=LLVM
// style is validated against a strict allowlist before use
app.get('/defaults', (req, res) => {
  const style = (req.query.style as string) || 'LLVM';
  const ALLOWED_STYLES = ['LLVM', 'Google', 'Chromium', 'Mozilla', 'WebKit', 'Microsoft', 'GNU'];
  if (!ALLOWED_STYLES.includes(style)) {
    return res.status(400).json({ error: 'Invalid style' });
  }
  // Safe: style is from allowlist, not shell-interpolated (spawnSync, not exec)
  const result = spawnSync(
    CLANG_FORMAT_BIN,
    ['--dump-config', `--style=${style}`],
    { encoding: 'utf8', timeout: 10000 }
  );
  if (result.error || result.status !== 0) {
    return res.status(500).json({ error: result.stderr || 'clang-format failed' });
  }
  try {
    const parsed = yaml.load(result.stdout) as Record<string, unknown>;
    res.json(parsed);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to parse clang-format output' });
  }
});

// POST /format
// User code and config written to temp files — never shell-interpolated
app.post('/format', (req, res) => {
  const { code, config } = req.body as { code: string; config: Record<string, unknown> };
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'code must be a string' });
  }

  const configPath = join(tmpdir(), `cfstudio-cfg-${Date.now()}.yaml`);
  const codePath = join(tmpdir(), `cfstudio-code-${Date.now()}.cpp`);

  try {
    const configYaml = '---\n' + yaml.dump(config || {});
    writeFileSync(configPath, configYaml, 'utf8');
    writeFileSync(codePath, code, 'utf8');

    // Safe: all args are constructed internally, no user input in argv
    const result = spawnSync(
      CLANG_FORMAT_BIN,
      [`--style=file:${configPath}`, codePath],
      { encoding: 'utf8', timeout: 15000 }
    );

    if (result.error) throw result.error;
    if (result.status !== 0) {
      return res.status(400).json({ error: result.stderr || 'clang-format failed' });
    }
    res.json({ formatted: result.stdout });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    try { unlinkSync(configPath); } catch {}
    try { unlinkSync(codePath); } catch {}
  }
});

app.listen(PORT, () => {
  console.log(`clang-format studio server → http://localhost:${PORT}`);
  const bin = findClangFormat();
  console.log(bin
    ? `  clang-format: ${bin}`
    : '  WARNING: clang-format not found in PATH');
});
