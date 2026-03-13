# NASUI 前端项目（Vue3 + Vite）

本目录包含已生成的前端代码，可直接用于开发和部署。

## 运行（开发模式）

```bash
cd frontend
npm install
npm run dev
```

访问：`http://localhost:5173`

> **注意**：开发模式下，Vite 已配置代理 `/api` 到 `http://localhost:3000`，因此请先启动后端服务。

## 构建（生产模式）

```bash
npm run build
```

构建输出会生成在 `dist/` 目录，可直接交由后端静态托管。
