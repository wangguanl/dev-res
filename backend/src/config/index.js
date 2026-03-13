import path from 'path';

const env = process.env;

const parseDiskList = (value) => {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error('DISK_LIST 格式错误，须为 JSON 数组');
  }
};

export const config = {
  port: env.PORT ? Number(env.PORT) : 3000,
  diskList: parseDiskList(env.DISK_LIST),
  maxScanDepth: env.MAX_SCAN_DEPTH ? Number(env.MAX_SCAN_DEPTH) : 3,
  cacheTTLSeconds: env.CACHE_TTL_SECONDS ? Number(env.CACHE_TTL_SECONDS) : 300,
  rootDir: path.resolve(process.cwd()),
};
