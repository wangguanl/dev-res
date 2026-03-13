import { asyncHandler } from '../middleware/asyncHandler.js';
import { getDiskById } from '../services/disk.service.js';
import { resolveDiskPath } from '../utils/path.util.js';
import { streamFile as streamFileService } from '../services/stream.service.js';

export const streamFile = asyncHandler(async (req, res) => {
  const { diskId, path: relativePath } = req.query;
  if (!diskId || !relativePath) {
    return res.status(400).json({ code: 1001, message: 'diskId/path 为必填参数', data: null });
  }

  const disk = getDiskById(diskId);
  if (!disk) {
    return res.status(400).json({ code: 1002, message: '硬盘未找到', data: null });
  }

  const filePath = resolveDiskPath(disk.path, relativePath);
  await streamFileService(res, filePath, { download: req.query.download === '1' });
});
