import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = process.cwd();

function resolve(path: string) {
  return join(ROOT, path);
}

export async function readJSON<T>(path: string): Promise<T | null> {
  try {
    const text = readFileSync(resolve(path), 'utf8');
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeJSON(path: string, data: unknown, _message: string): Promise<boolean> {
  try {
    const full = resolve(path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

export async function deleteEntry(path: string, _message: string): Promise<boolean> {
  try {
    const full = resolve(path);
    if (!existsSync(full)) return false;
    unlinkSync(full);
    // remove parent dir if now empty
    try {
      const parent = dirname(full);
      if (readdirSync(parent).length === 0) {
        import('fs').then(({ rmdirSync }) => rmdirSync(parent));
      }
    } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

export async function listSlugs(path: string): Promise<string[]> {
  try {
    const full = resolve(path);
    if (!existsSync(full)) return [];
    return readdirSync(full, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {
    return [];
  }
}

export async function uploadImage(repoPath: string, file: File): Promise<string> {
  const full = resolve(repoPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, Buffer.from(await file.arrayBuffer()));
  return '/' + repoPath.replace(/^public\//, '');
}

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
