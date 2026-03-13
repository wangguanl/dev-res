# 后端落地方案（Node.js + Express）

本方案聚焦后端实现落地，包含架构、关键模块、示例代码、配置策略及安全/性能保障方案。适合在 Win10 上部署，并为前端提供完整接口支持。

---

## 1. 技术栈与依赖

### 1.1 推荐 Node 版本
- **Node.js 16+**（建议使用 LTS 版本，如 18/20）

### 1.2 关键依赖（示例 package.json）
- `express`：HTTP 服务框架
- `cors`：跨域支持
- `dotenv`：环境变量管理
- `morgan`：请求日志（开发/调试）
- `mime-types`：根据扩展名获取 Content-Type
- `lodash`（可选）：常用工具函数

示例 `package.json`：
```json
{
  "name": "nasui-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "mime-types": "^2.1.35",
    "morgan": "^1.10.0"
  }
}
```

---

## 2. 项目结构建议

```
backend/
  ├─ src/
  │   ├─ config/
  │   │   ├─ index.js            # 读取环境变量 / 配置白名单硬盘
  │   │   └─ diskList.json       # 可选：硬盘配置文件
  │   ├─ controllers/
  │   │   ├─ disks.controller.js
  │   │   ├─ resources.controller.js
  │   │   └─ files.controller.js
  │   ├─ services/
  │   │   ├─ disk.service.js
  │   │   ├─ scan.service.js
  │   │   └─ stream.service.js
  │   ├─ utils/
  │   │   ├─ path.util.js        # 规范路径、防穿越
  │   │   ├─ cache.util.js       # 内存缓存（可选）
  │   │   └─ logger.js           # 日志管理
  │   ├─ routes.js
  │   └─ index.js
  ├─ .env
  ├─ package.json
  └─ README.md
```

---

## 3. 关键配置（白名单 & 安全）

### 3.1 环境变量示例（`.env`）
```
PORT=3000
NODE_ENV=development
DISK_LIST=[
  {"id":"disk1","name":"视频","path":"D:/视频"},
  {"id":"disk2","name":"音频","path":"E:/音频"},
  {"id":"disk3","name":"PDF","path":"F:/PDF"}
]
MAX_SCAN_DEPTH=3
CACHE_TTL_SECONDS=300
```

### 3.2 白名单验证
- 所有输入 `diskId` 仅允许匹配 `DISK_LIST` 中的项
- 所有文件 `path` 均由后端构建：`path.resolve(base, relativePath)` 并验证结果在 base 目录下
- 禁止 `..`、绝对路径、URL 编码绕过等路径穿越行为

---

## 4. 核心模块实现要点

### 4.1 路由层（`routes.js`）
- `GET /api/disks` → 返回硬盘列表
- `GET /api/disks/:diskId/resources` → 返回资源列表（分类、分页）
- `GET /api/files/stream` → 流式输出文件（支持 Range）
- 可选：`GET /api/search`、`POST /api/files/upload` 等扩展接口

### 4.2 控制层（controllers）
- 处理请求参数、校验、调用 Service 层
- 统一格式化返回 JSON（code/message/data）
- 统一异常捕获与错误码映射

### 4.3 业务层（services）

#### 4.3.1 硬盘服务（`disk.service.js`）
- 读写白名单硬盘配置
- 根据 `diskId` 查找硬盘根路径

#### 4.3.2 资源扫描（`scan.service.js`）
- 递归遍历目录（受 `MAX_SCAN_DEPTH` 限制）
- 过滤文件类型并分类（video/audio/pdf/other）
- 支持分页：先收集满足条件的文件再分页返回；或者使用迭代器按需分页
- 可选：简单缓存（按硬盘+目录+分类缓存结果，TTL 300s）

#### 4.3.3 流式下载（`stream.service.js`）
- 通过 `fs.createReadStream()` 创建流
- 解析 `Range` 头，实现断点续传（206 Partial Content）
- 设置 `Content-Type`（来自 `mime-types.lookup`），设置 `Content-Disposition`（是否 attachment）

---

## 5. 安全与容错

### 5.1 路径穿越防护
- 任何 `path` 参数都必须经过 `path.normalize()` / `path.resolve()`
- 验证生成的路径是否以硬盘根目录开头

示例校验：
```js
const safeResolve = (base, rel) => {
  const resolved = path.resolve(base, rel);
  if (!resolved.startsWith(base)) {
    throw new Error('路径越权');
  }
  return resolved;
};
```

### 5.2 异常处理
- 统一错误处理中间件，捕获同步/异步异常
- 对已知错误（路径越权、文件不存在等）返回明确错误代码和可读消息
- 记录异常日志（含请求 ID / trace）以便排查

### 5.3 性能保障
- **流式读取**：避免 `fs.readFile` 读取大文件
- **缓存扫描结果**：避免每次请求都遍历目录
- **限制扫描深度**：防止全盘遍历导致高 IO
- **并发限流（可选）**：使用 `express-rate-limit` 限制单 IP 请求频率

---

## 6. 示例代码片段

### 6.1 目录扫描（分类 + 分页）
```js
import fs from 'fs/promises';
import path from 'path';

const categoryMap = {
  video: ['.mp4', '.mkv', '.avi'],
  audio: ['.mp3', '.flac', '.wav'],
  pdf: ['.pdf'],
};

function getCategory(ext) {
  ext = ext.toLowerCase();
  for (const [cat, exts] of Object.entries(categoryMap)) {
    if (exts.includes(ext)) return cat;
  }
  return 'other';
}

async function scanDir(root, relative = '', depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return [];
  const dir = path.join(root, relative);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const ent of entries) {
    const relPath = path.join(relative, ent.name);
    const absPath = path.join(root, relPath);

    if (ent.isDirectory()) {
      const child = await scanDir(root, relPath, depth + 1, maxDepth);
      results.push(...child);
      continue;
    }

    const stat = await fs.stat(absPath);
    const ext = path.extname(ent.name);
    const type = getCategory(ext);

    results.push({
      name: ent.name,
      relativePath: relPath.replace(/\\/g, '/'),
      size: stat.size,
      mtime: stat.mtimeMs,
      type,
      mime: mime.lookup(ext) || 'application/octet-stream',
    });
  }

  return results;
}
```

### 6.2 流式响应（支持 Range）
```js
import fs from 'fs';
import mime from 'mime-types';

export function streamFile(res, filePath, opts = {}) {
  const stat = fs.statSync(filePath);
  const range = res.req.headers.range;
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', chunkSize);

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
  }
}
```

---

## 7. 运行与部署

### 7.1 开发运行
1. 安装依赖：`npm install`
2. 启动服务：`npm run dev`
3. 访问：`http://localhost:3000/api/disks`

### 7.2 生产部署（建议）
- 使用 `pm2` 或 `nssm`/`Windows 服务` 守护进程
- 将前端构建目录 `dist/` 作为静态资源托管在后端（`express.static()`）
- 设置防火墙规则，仅允许局域网 IP 访问后端端口

---

## 8. 后续可扩展点

- **鉴权/登录**：简单密码、JWT、OAuth
- **操作接口**：创建/重命名/删除文件夹、上传文件
- **详细访问日志**：记录每次下载/预览的文件及来源 IP
- **多硬盘动态热插**：检测硬盘变化并实时更新白名单（仅限内置硬盘）
- **集成索引引擎**：Elasticsearch / Lunr.js 提升搜索性能

---

> 注：后端实现应以“最小权限、最少依赖、可监控”为原则，确保在家庭/小型局域网场景下稳定、易用、易维护。