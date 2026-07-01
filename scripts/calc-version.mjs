#!/usr/bin/env node

/**
 * calc-version.mjs — Conventional Commits Version Calculator
 *
 * Lee los commits desde el último tag hasta HEAD, analiza los
 * conventional commits, y determina la próxima versión semántica.
 *
 * Uso:
 *   node scripts/calc-version.mjs              # imprime: 1.14.0
 *   node scripts/calc-version.mjs --json       # imprime JSON con detalles
 *   node scripts/calc-version.mjs 1.13.3       # desde versión específica
 *
 * Reglas de versionado:
 *   feat:       → MINOR (nueva funcionalidad)
 *   fix:        → PATCH (corrección)
 *   feat!:      → MAJOR (breaking change)
 *   fix!:       → MAJOR (breaking change)
 *   BREAKING CHANGE → MAJOR (en footer del commit)
 *   docs/chore/test/style/refactor/perf → no bump
 *
 * Exit codes:
 *   0 = éxito, imprime la versión
 *   1 = error (no hay commits, no se pudo determinar)
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Conventional Commit Types ─────────────────────────
// Cada tipo define su bump (null = no bump).
// La sección es para el changelog (no se usa acá).

const COMMIT_TYPES = {
  feat:  { bump: 'minor' },
  fix:   { bump: 'patch' },
  perf:  { bump: 'patch' },
  refactor: { bump: 'patch' },
  revert: { bump: 'patch' },
  deps:  { bump: null },
  docs:  { bump: null },
  style: { bump: null },
  test:  { bump: null },
  build: { bump: null },
  ci:    { bump: null },
  chore: { bump: null },
};

// Regex para parsear el header del commit.
// Grupos: 1 = type, 2 = scope (opcional), 3 = bang (!), 4 = description
const COMMIT_PATTERN = /^(\w+)(\([\w\s/-]+\))?(!)?:\s*(.*)$/;

// Footer de BREAKING CHANGE (puede estar en cualquier línea del body)
const BREAKING_FOOTER = /^BREAKING[\s-]CHANGE:\s*/;

// ─── Parse a single commit message ─────────────────────
function parseCommit(message) {
  const lines = message.split('\n').filter(Boolean);
  const header = lines[0] || '';
  const body = lines.slice(1);
  const match = header.match(COMMIT_PATTERN);

  if (!match) {
    return null; // No es un conventional commit
  }

  const [, rawType, , bang] = match;
  const type = rawType.toLowerCase();
  const typeConfig = COMMIT_TYPES[type];

  // Detectar breaking change: ! en el header O "BREAKING CHANGE:" en el body
  const breaking = bang === '!' || body.some((l) => BREAKING_FOOTER.test(l));

  // El bump se determina así:
  //   1. Si es breaking → major
  //   2. Si tiene typeConfig.bump → ese bump
  //   3. Si no → null (no bumps)
  let bump = null;
  if (breaking) {
    bump = 'major';
  } else if (typeConfig) {
    bump = typeConfig.bump;
  }

  return { type, breaking, bump };
}

// ─── Parse a semver version string ─────────────────────
function parseVersion(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

// ─── Format a version object back to string ───────────
function formatVersion(v) {
  return `${v.major}.${v.minor}.${v.patch}`;
}

// ─── Bump a version by increment type ─────────────────
function bumpVersion(version, increment) {
  const v = parseVersion(version);
  if (!v) return null;

  switch (increment) {
    case 'major':
      v.major++;
      v.minor = 0;
      v.patch = 0;
      break;
    case 'minor':
      v.minor++;
      v.patch = 0;
      break;
    case 'patch':
      v.patch++;
      break;
    default:
      return null;
  }

  return formatVersion(v);
}

// ─── Get the latest git tag ──────────────────────────
function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return null; // No tags yet → primera release
  }
}

// ─── Get commits since a given ref ───────────────────
function getCommitsSince(ref) {
  // Formato: cada commit separado por "---" para parseo fácil
  const range = ref ? `${ref}..HEAD` : 'HEAD';
  try {
    const raw = execSync(`git log --format="---%n%s%n%b" ${range}`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB para repos grandes
    });
    return raw;
  } catch (err) {
    console.error('Error reading git log:', err.message);
    return '';
  }
}

// ─── Parse the raw git log into commit objects ──────
function parseGitLog(raw) {
  const entries = raw.split('\n---\n');
  const commits = [];

  for (const entry of entries) {
    const lines = entry.split('\n').filter(Boolean);
    if (lines.length < 1) continue;

    const message = lines.join('\n');
    const parsed = parseCommit(message);
    if (parsed) {
      commits.push(parsed);
    }
  }

  return commits;
}

// ─── Main ───────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const explicitVersion = args.find((a) => !a.startsWith('--'));

  // Determinar versión actual
  const tag = getLatestTag();

  // Leer versión desde package.json como fallback
  let pkgVersion = null;
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    pkgVersion = pkg.version;
  } catch {}

  // Prioridad: 1) argumento explícito, 2) tag, 3) package.json, 4) 0.0.0
  const currentVersion = explicitVersion
    || (tag ? tag.replace(/^v/, '') : null)
    || pkgVersion
    || '0.0.0';

  const parsedCurrent = parseVersion(currentVersion);
  if (!parsedCurrent) {
    console.error(`Invalid current version: ${currentVersion}`);
    process.exit(1);
  }

  // Obtener commits desde el tag
  const raw = getCommitsSince(tag);
  const commits = parseGitLog(raw);

  if (commits.length === 0) {
    if (isJson) {
      console.log(JSON.stringify({
        currentVersion,
        nextVersion: currentVersion,
        increment: null,
        commits: [],
      }));
    } else {
      console.log(currentVersion); // Sin cambios → misma versión
    }
    return;
  }

  // Determinar bump
  let increment = 'patch'; // default: patch

  for (const commit of commits) {
    if (!commit.bump) continue;

    // Escalar el incremento según la severidad
    // patch < minor < major
    if (commit.bump === 'major') {
      increment = 'major';
    } else if (commit.bump === 'minor' && increment === 'patch') {
      increment = 'minor';
    }
  }

  const nextVersion = bumpVersion(currentVersion, increment);

  if (isJson) {
    console.log(JSON.stringify({
      currentVersion,
      nextVersion,
      increment,
      commits: commits.map((c) => ({
        type: c.type,
        breaking: c.breaking,
        bump: c.bump,
      })),
    }));
  } else {
    console.log(nextVersion);
  }
}

main();
