export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 1006;
  const message = err.message || '内部服务错误';

  // 控制台输出便于调试
  console.error(err);

  res.status(status).json({
    code,
    message,
    data: null,
  });
}
