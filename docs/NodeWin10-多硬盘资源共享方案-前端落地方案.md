# 前端落地方案（Vue3 + Vite + Element Plus）

本方案面向前端实现，围绕前后端分离的接口规范（已在接口规划中定义），提供一个响应式、手机/PC通用的资源浏览体验。

---

## 1. 技术栈与项目结构

### 1.1 关键技术
- **框架**：Vue 3（Composition API）
- **构建工具**：Vite
- **UI 组件**：Element Plus（桌面/移动均可）
- **HTTP 客户端**：Axios
- **状态管理**：Pinia（可选；小型项目可仅在组件内管理）
- **路由**：Vue Router

### 1.2 推荐项目目录结构

```
frontend/
  ├─ public/                 # 公共静态资源
  ├─ src/
  │   ├─ api/
  │   │   ├─ disks.js       # 硬盘列表接口
  │   │   ├─ resources.js   # 资源列表接口
  │   │   └─ files.js       # 下载/预览接口
  │   ├─ components/
  │   │   ├─ DiskSelector.vue
  │   │   ├─ ResourceCard.vue
  │   │   ├─ ResourceGrid.vue
  │   │   ├─ PreviewModal.vue
  │   │   └─ ErrorAlert.vue
  │   ├─ pages/
  │   │   ├─ Home.vue
  │   │   └─ Preview.vue
  │   ├─ router/
  │   │   └─ index.js
  │   ├─ store/              # Pinia store（可选）
  │   │   └─ useAppStore.js
  │   ├─ styles/
  │   │   └─ variables.scss
  │   ├─ utils/
  │   │   ├─ http.js         # Axios 实例
  │   │   └─ helpers.js
  │   ├─ App.vue
  │   └─ main.js
  ├─ index.html
  ├─ package.json
  └─ vite.config.js
```

---

## 2. 核心页面与组件设计

### 2.1 主页（Home.vue）

主页是用户主要的交互界面，包含：
- 硬盘选择（下拉）
- 分类标签页（视频/音频/PDF/其他）
- 资源列表（卡片/表格）
- 加载状态、错误提示

#### 页面流程
1. 初始化加载：调用 `GET /api/disks` 获取硬盘列表
2. 默认选中第一个硬盘，并调用 `GET /api/disks/:diskId/resources` 获取资源列表
3. 切换硬盘或分类时再次请求资源接口
4. 点击资源卡片：若支持预览则进入预览页，否则直接下载

### 2.2 资源卡片（ResourceCard.vue）

每个资源展现：
- 缩略图（视频/音频/PDF 可用占位图）
- 文件名、大小、修改时间
- 操作按钮：预览/下载

### 2.3 预览页（Preview.vue）

用于播放视频/音频或展示 PDF 文档。核心逻辑：
- 根据路由参数构造文件流 URL：`/api/files/stream?diskId=...&path=...`
- 使用 HTML 原生标签 (`<video>`, `<audio>`, `<iframe>`) 播放/展示
- 提供“下载”按钮

---

## 3. 数据流与状态管理

### 3.1 无状态模式（简单场景）

后端每次都返回最新数据，页面无需缓存；Vue 组件自身负责请求与渲染。

### 3.2 使用 Pinia（推荐：便于跨页面状态共享）

#### 示例 Store（`useAppStore.js`）：
- `disks`: 硬盘列表
- `currentDisk`: 当前选中硬盘
- `category`: 当前分类
- `resources`: 当前资源列表
- `loading` / `error` 状态

---

## 4. API 调用示例

### 4.1 Axios 实例（`src/utils/http.js`）

```js
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

instance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message;
    return Promise.reject(new Error(msg));
  }
);

export default instance;
```

### 4.2 硬盘列表接口调用（`src/api/disks.js`）

```js
import http from '@/utils/http';

export function fetchDisks() {
  return http.get('/disks');
}
```

### 4.3 资源列表接口调用（`src/api/resources.js`）

```js
import http from '@/utils/http';

export function fetchResources({ diskId, category = 'all', folder = '', page = 1, pageSize = 50 }) {
  return http.get('/disks/' + diskId + '/resources', {
    params: { category, folder, page, pageSize },
  });
}
```

---

## 5. UX 细节与响应式布局

### 5.1 响应式布局
使用 `CSS Grid` 或 Element Plus 的栅格系统实现：
- PC：4 列卡片
- 平板：2-3 列
- 手机：1-2 列

### 5.2 加载提示与空状态
- 使用 Element Plus 的 `el-loading` 或 `el-skeleton` 显示加载状态
- 资源为空时显示“暂无资源”占位

### 5.3 错误提示
使用统一的 `ErrorAlert` 组件展示错误，支持：
- 加载失败（接口错误、网络异常）
- 资源不存在（404）
- 无权限（403）

---

## 6. 部署方案

### 6.1 开发运行
- 安装依赖：`npm install`
- 启动开发服务器：`npm run dev`
- 默认访问：`http://localhost:5173`

### 6.2 生产构建
- 构建静态文件：`npm run build`
- 结果输出在 `dist/` 目录
- 可将 `dist/` 目录直接复制到后端服务器，根据后端方案用 `express.static()` 托管

### 6.3 部署建议
- 推荐将前端静态与后端 API 统一部署到同一个域名/端口，避免额外跨域配置
- 如需独立部署，在后端开启 CORS 并在前端配置 `VITE_API_BASE_URL` 指向后端地址

---

## 7. 进阶优化建议

### 7.1 预览体验
- 视频/音频：添加播放进度、倍速、全屏
- PDF：使用 `pdf.js` 提升展示效果，支持分页滚动

### 7.2 离线缓存（PWA）
- 使用 Vite PWA 插件，将常用页面与资源缓存到本地，提升局域网访问速度

### 7.3 国际化（i18n）
- 使用 `vue-i18n` 支持中文/英文切换，面向多语言家庭或团队

---

> 本方案侧重“即刻可用”的前端实现路径，同时保留良好扩展能力；可根据实际业务需求进一步扩展鉴权、权限控制、文件上传与管理等高级功能。