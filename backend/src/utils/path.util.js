import path from 'path';

export const normalizeWinPath = (p) => p.replace(/\\/g, '/');

export const ensureWithinBase = (base, target) => {
  const baseNorm = path.resolve(base);
  const targetNorm = path.resolve(target);
  if (!targetNorm.startsWith(baseNorm)) {
    throw new Error('路径越权');
  }
  return targetNorm;
};

export const resolveDiskPath = (diskRoot, relativePath = '') => {
  const unsafe = path.join(diskRoot, relativePath || '');
  return ensureWithinBase(diskRoot, unsafe);
};
