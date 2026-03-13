import express from 'express';

import { getDisks } from './controllers/disks.controller.js';
import { getResources } from './controllers/resources.controller.js';
import { streamFile } from './controllers/files.controller.js';

const router = express.Router();

router.get('/disks', getDisks);
router.get('/disks/:diskId/resources', getResources);
router.get('/files/stream', streamFile);

export default router;
