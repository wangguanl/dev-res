import fs from 'fs';
import mime from 'mime-types';

export async function streamFile(res, filePath, options = {}) {
  const stat = await fs.promises.stat(filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');

  if (options.download) {
    const filename = options.filename || filePath.split(/[\\/]/).pop();
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  }

  const range = res.req.headers.range;
  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', chunkSize);
    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
    return;
  }

  res.setHeader('Content-Length', stat.size);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
