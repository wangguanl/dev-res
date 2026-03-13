import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

import { config } from '../config/index.js';
import { resolveDiskPath } from '../utils/path.util.js';
import { getCache, setCache } from '../utils/cache.util.js';

const CATEGORY_MAP = {
  video: ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.webm'],
  audio: ['.mp3', '.flac', '.wav', '.aac', '.ogg'],
  pdf: ['.pdf'],
};

const getCategoryByExt = (ext) => {
  const lower = ext.toLowerCase();
  for (const [cat, exts] of Object.entries(CATEGORY_MAP)) {
    if (exts.includes(lower)) return cat;
  }
  return 'other';
};

const normalizeRelPath = (p) => p.replace(/\\/g, '/').replace(/^\//, '');

const buildResource = (diskId, relPath, stat) => {
  const ext = path.extname(relPath);
  const type = getCategoryByExt(ext);
  const mimeType = mime.lookup(ext) || 'application/octet-stream';

  return {
    name: path.basename(relPath),
    relativePath: normalizeRelPath(relPath),
    size: stat.size,
    mtime: stat.mtimeMs,
    type,
    mime: mimeType,
    previewUrl: `/api/files/stream?diskId=${diskId}&path=${encodeURIComponent(normalizeRelPath(relPath))}`,
  };
};

const scanDir = async (diskRoot, diskId, rel, depth, maxDepth, results) => {
  if (depth > maxDepth) return;
  const abs = resolveDiskPath(diskRoot, rel);
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch (err) {
    // 目录无法读取（权限/不存在）
    return;
  }

  for (const entry of entries) {
    const nextRel = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      await scanDir(diskRoot, diskId, nextRel, depth + 1, maxDepth, results);
      continue;
    }

    const stat = await fs.stat(resolveDiskPath(diskRoot, nextRel));
    results.push(buildResource(diskId, nextRel, stat));
  }
};

export async function scanResources({ diskId, diskRoot, category = 'all', folder = '', page = 1, pageSize = 50 }) {
  const relRoot = normalizeRelPath(folder || '');
  const cacheKey = `scan:${diskId}:${diskRoot}:${category}:${relRoot}:${page}:${pageSize}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const results = [];
  await scanDir(diskRoot, diskId, relRoot, 0, config.maxScanDepth, results);

  const filtered = results.filter((item) => {
    if (category === 'all') return true;
    return item.type === category;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const payload = {
    total,
    page,
    pageSize,
    items,
  };

  setCache(cacheKey, payload, config.cacheTTLSeconds);
  return payload;
}
