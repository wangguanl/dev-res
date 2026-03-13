import { getAllDisks } from '../services/disk.service.js';

export const getDisks = (req, res) => {
  const disks = getAllDisks();
  res.json({
    code: 0,
    message: 'success',
    data: disks,
  });
};
