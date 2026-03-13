# NASUI 后端服务

本项目提供基于 Node.js + Express 的文件资源共享接口，用于在 Win10 上将本地硬盘资源（视频/音频/PDF）通过 HTTP 方式在局域网内共享。

## 启动步骤

1. 安装依赖

```bash
cd backend
npm install
```

2. 复制并配置环境变量

```bash
cp .env.sample .env
# 编辑 .env 中的 DISK_LIST，填入可共享的磁盘路径
```

3. 启动服务

```bash
npm run dev
```

## 接口说明

- `GET /api/disks` - 获取硬盘列表
- `GET /api/disks/:diskId/resources` - 获取资源分类列表
- `GET /api/files/stream?diskId=...&path=...` - 文件流预览/下载（支持 Range）

## 注意事项

- 项目默认使用 ESM（`type: "module"`）
- 请勿将系统盘（如 C:）的敏感目录加入 `DISK_LIST`，避免权限和安全风险
