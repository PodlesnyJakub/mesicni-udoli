import { Buffer } from 'node:buffer';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;
const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

const authHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
};

async function getFile(path: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(`${API_BASE}/${path}`, { headers: authHeaders });
  if (!res.ok) return null;
  return res.json();
}

export async function readJSON<T>(path: string): Promise<T | null> {
  try {
    const file = await getFile(path);
    if (!file?.content) return null;
    const text = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8');
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeJSON(path: string, data: unknown, message: string): Promise<boolean> {
  try {
    const existing = await getFile(path);
    const content = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        message,
        content,
        ...(existing?.sha ? { sha: existing.sha } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteEntry(path: string, message: string): Promise<boolean> {
  try {
    const existing = await getFile(path);
    if (!existing?.sha) return false;
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'DELETE',
      headers: authHeaders,
      body: JSON.stringify({ message, sha: existing.sha }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listSlugs(dirPath: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/${dirPath}`, { headers: authHeaders });
    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];
    return items
      .filter((item: { type: string }) => item.type === 'dir')
      .map((item: { name: string }) => item.name);
  } catch {
    return [];
  }
}

export async function uploadImage(repoPath: string, file: File): Promise<string> {
  const content = Buffer.from(await file.arrayBuffer()).toString('base64');
  const existing = await getFile(repoPath);
  const res = await fetch(`${API_BASE}/${repoPath}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      message: `Upload image: ${repoPath}`,
      content,
      ...(existing?.sha ? { sha: existing.sha } : {}),
    }),
  });
  if (!res.ok) throw new Error('Image upload failed');
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
