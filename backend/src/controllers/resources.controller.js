import { asyncHandler } from '../middleware/asyncHandler.js';
import { getDiskById } from '../services/disk.service.js';
import { scanResources } from '../services/scan.service.js';

export const getResources = asyncHandler(async (req, res) => {
  const { diskId } = req.params;
  const { category = 'all', folder = '', page = 1, pageSize = 50 } = req.query;

  const disk = getDiskById(diskId);
  if (!disk) {
    return res.status(400).json({ code: 1002, message: '硬盘未找到', data: null });
  }

  const list = await scanResources({
    diskId: diskId,
    diskRoot: disk.path,
    category,
    folder,
    page: Number(page),
    pageSize: Number(pageSize),
  });

  res.json({
    code: 0,
    message: 'success',
    data: list,
  });
});
