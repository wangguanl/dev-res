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

const assertReadableDirectory = async (absPath) => {
  try {
    const stat = await fs.stat(absPath);
    if (!stat.isDirectory()) {
      const err = new Error('目录不存在或不可访问');
      err.status = 400;
      err.code = 1004;
      throw err;
    }
  } catch {
    const err = new Error('目录不存在或不可访问');
    err.status = 400;
    err.code = 1004;
    throw err;
  }
};

const buildResource = (diskId, relPath, stat, isDirectory) => {
  const ext = path.extname(relPath);
  const type = isDirectory ? 'folder' : getCategoryByExt(ext);
  const mimeType = isDirectory ? 'inode/directory' : mime.lookup(ext) || 'application/octet-stream';

  return {
    name: path.basename(relPath),
    relativePath: normalizeRelPath(relPath),
    size: stat.size,
    mtime: stat.mtimeMs,
    type,
    mime: mimeType,
    previewUrl: isDirectory ? null : `/api/files/stream?diskId=${diskId}&path=${encodeURIComponent(normalizeRelPath(relPath))}`,
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
      // 添加文件夹到结果
      const folderStat = await fs.stat(resolveDiskPath(diskRoot, nextRel));
      results.push(buildResource(diskId, nextRel, folderStat, true));
      // 递归扫描子文件夹
      await scanDir(diskRoot, diskId, nextRel, depth + 1, maxDepth, results);
    } else {
      const stat = await fs.stat(resolveDiskPath(diskRoot, nextRel));
      results.push(buildResource(diskId, nextRel, stat, false));
    }
  }
};

export async function scanResources({ diskId, diskRoot, category = 'all', folder = '', page = 1, pageSize = 50, mode = 'list' }) {
  const relRoot = normalizeRelPath(folder || '');
  const absRoot = resolveDiskPath(diskRoot, relRoot);
  await assertReadableDirectory(absRoot);

  const cacheKey = `scan:${diskId}:${diskRoot}:${category}:${relRoot}:${page}:${pageSize}:${mode}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const results = [];
  await scanDir(diskRoot, diskId, relRoot, 0, config.maxScanDepth, results);

  const filteredByCategory = results.filter((item) => {
    if (category === 'all') return true;
    return item.type === category;
  });

  const folderPrefix = relRoot ? `${relRoot}/` : '';
  const filteredByFolder = filteredByCategory.filter((item) => {
    if (!folderPrefix) return true;
    return item.relativePath === relRoot || item.relativePath.startsWith(folderPrefix);
  });

  // 计算当前目录下的直接子项（用于分页和总数）
  const directItems = filteredByFolder.filter((item) => {
    if (!folderPrefix) {
      return item.relativePath.indexOf('/') === -1;
    }
    const sub = item.relativePath.slice(folderPrefix.length);
    return sub && !sub.includes('/');
  });

  // 列表模式：返回当前目录下的所有项（如果开启了分类过滤，则返回全量匹配项）
  let items = [];
  if (mode === 'tree') {
    items = filteredByFolder;
  } else {
    if (category !== 'all') {
      // 如果开启了分类过滤，在列表模式下直接返回所有匹配项，由前端展示为扁平列表或自动构建树
      items = filteredByFolder;
    } else {
      // 列表模式不分页，返回所有直接子项及其后代
      const rootPaths = new Set(directItems.map((item) => item.relativePath));

      // 包含每个根项本身
      items.push(...directItems);

      // 包含根项下的所有后代
      filteredByFolder.forEach((item) => {
        if (item.relativePath === '' || rootPaths.has(item.relativePath)) return;
        for (const root of rootPaths) {
          if (item.relativePath.startsWith(`${root}/`)) {
            items.push(item);
            break;
          }
        }
      });
    }
  }

  const payload = {
    total: (mode === 'tree' || category !== 'all') ? filteredByFolder.length : directItems.length,
    page: (mode === 'tree' || category !== 'all') ? page : 1,
    pageSize: (mode === 'tree' || category !== 'all') ? pageSize : filteredByFolder.length,
    items,
  };

  setCache(cacheKey, payload, config.cacheTTLSeconds);
  return payload;
}
