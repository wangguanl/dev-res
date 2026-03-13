# 前端落地方案（Vue3 + Vite + Element Plus）

本方案面向前端实现，围绕前后端分离的接口规范，提供一个响应式、手机/PC通用的资源浏览体验，支持列表和树状图两种视图模式。

---

## 1. 技术栈与项目结构

### 1.1 关键技术
- **框架**：Vue 3（Composition API）
- **构建工具**：Vite
- **UI 组件**：Element Plus（桌面/移动均可）
- **HTTP 客户端**：Axios
- **状态管理**：Pinia
- **路由**：Vue Router

### 1.2 实际项目目录结构

```
frontend/
  ├─ public/                 # 公共静态资源
  ├─ src/
  │   ├─ api/
  │   │   ├─ disks.js       # 硬盘列表接口
  │   │   ├─ resources.js   # 资源列表接口
  │   │   └─ http.js        # Axios 实例
  │   ├─ components/
  │   │   ├─ Breadcrumb.vue     # 面包屑导航
  │   │   ├─ ErrorAlert.vue     # 错误提示
  │   │   ├─ NestedList.vue     # 层级列表组件
  │   │   ├─ ResourceGrid.vue   # 资源网格/列表容器
  │   │   └─ ViewModeSwitcher.vue # 视图模式切换器
  │   ├─ pages/
  │   │   ├─ Home.vue           # 主页
  │   │   └─ Preview.vue        # 预览页
  │   ├─ router/
  │   │   └─ index.js           # 路由配置
  │   ├─ store/
  │   │   └─ useAppStore.js     # Pinia store
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
- 视图模式切换器（列表/树状图）
- 面包屑导航
- 资源显示区域（根据模式显示不同组件）
- 加载状态、错误提示

#### 页面流程
1. 初始化加载：调用 `GET /api/disks` 获取硬盘列表
2. 默认选中第一个硬盘，并调用 `GET /api/disks/:diskId/resources` 获取资源列表
3. 根据路由（/list 或 /tree）确定视图模式
4. 切换硬盘、分类或导航时重新请求资源接口
5. 点击资源：文件夹进入下一级，文件进入预览页

### 2.2 视图模式切换器（ViewModeSwitcher.vue）

位于页面顶部的切换组件：
- 列表模式：显示层级嵌套的文件夹结构
- 树状图模式：显示完整的树形结构

### 2.3 面包屑导航（Breadcrumb.vue）

显示当前路径，支持点击跳转到上级目录。

### 2.4 资源网格容器（ResourceGrid.vue）

根据视图模式渲染不同内容：
- 列表模式：使用 `NestedList` 组件显示层级结构
- 树状图模式：使用 `el-tree` 显示树形结构

#### 核心功能
- 构建树形数据结构
- 处理文件夹导航和文件预览
- 相对路径转换（相对于当前文件夹）

### 2.5 层级列表组件（NestedList.vue）

递归组件，用于显示文件夹的嵌套结构：
- 支持展开/折叠文件夹
- 显示文件大小信息
- 递归渲染子文件夹

### 2.6 预览页（Preview.vue）

用于播放视频/音频或展示 PDF 文档：
- 根据路由参数构造文件流 URL
- 使用 HTML 原生标签播放/展示
- 提供下载功能

---

## 3. 数据流与状态管理

### 3.1 Pinia Store（useAppStore.js）

#### 状态结构：
```js
{
  disks: [],              // 硬盘列表
  currentDiskId: '',      // 当前选中硬盘ID
  category: 'all',        // 当前分类
  currentFolder: '',      // 当前文件夹路径
  viewMode: 'list',       // 视图模式（由路由决定）
  resources: {            // 资源数据
    total: 0,
    page: 1,
    pageSize: 50,
    items: []
  },
  loading: false,
  error: null
}
```

#### 核心逻辑：
- 路由驱动的状态更新
- 统一的资源加载函数
- 错误和加载状态管理

---

## 4. API 调用示例

### 4.1 Axios 实例（`src/api/http.js`）

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
import http from './http';

export function fetchDisks() {
  return http.get('/disks');
}
```

### 4.3 资源列表接口调用（`src/api/resources.js`）

```js
import http from './http';

export function fetchResources({ diskId, category = 'all', folder = '', page = 1, pageSize = 50, mode = 'list' }) {
  return http.get(`/disks/${diskId}/resources`, {
    params: { category, folder, page, pageSize, mode },
  });
}
```

---

## 5. 路由设计

### 5.1 路由配置

```js
const routes = [
  { path: '/', redirect: '/list' },
  { path: '/list', name: 'List', component: Home },
  { path: '/tree', name: 'Tree', component: Home },
  { path: '/preview', name: 'Preview', component: Preview, props: true },
];
```

### 5.2 路由参数

- `path`: 当前文件夹路径（如 'blog'、'blog/api'）
- 视图模式由路由名称决定

---

## 6. UX 细节与响应式布局

### 6.1 响应式布局
使用 Element Plus 的布局组件：
- 顶部：视图切换器
- 主要内容区：面包屑 + 资源列表
- 支持移动端适配

### 6.2 加载提示与空状态
- 使用 `el-skeleton` 显示加载状态
- 资源为空时显示友好提示

### 6.3 错误提示
使用 `ErrorAlert` 组件统一处理错误。

---

## 7. 部署方案

### 7.1 开发运行
- 安装依赖：`npm install`
- 启动开发服务器：`npm run dev`
- 默认访问：`http://localhost:5175`（代理到后端）

### 7.2 生产构建
- 构建静态文件：`npm run build`
- 结果输出在 `dist/` 目录
- 可部署到后端服务器

### 7.3 部署建议
- 前后端统一部署，避免跨域
- 使用 Vite 代理配置开发环境

---

## 8. 核心功能实现

### 8.1 视图模式切换
- 路由驱动，无需额外状态
- 列表模式：层级显示，支持展开/折叠
- 树状图模式：完整树形结构，默认展开

### 8.2 文件夹导航
- 面包屑显示当前路径
- 点击文件夹更新路由 query.path
- 支持前进后退

### 8.3 数据处理
- 后端返回扁平数据，前端构建树形结构
- 相对路径转换，确保导航正确
- 缓存机制优化性能

---

---

## 4. API 调用示例

### 4.1 Axios 实例（`src/api/http.js`）

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
import http from './http';

export function fetchDisks() {
  return http.get('/disks');
}
```

### 4.3 资源列表接口调用（`src/api/resources.js`）

```js
import http from './http';

export function fetchResources({ diskId, category = 'all', folder = '', page = 1, pageSize = 50, mode = 'list' }) {
  return http.get(`/disks/${diskId}/resources`, {
    params: { category, folder, page, pageSize, mode },
  });
}
```

---

## 5. 路由设计

### 5.1 路由配置

```js
const routes = [
  { path: '/', redirect: '/list' },
  { path: '/list', name: 'List', component: Home },
  { path: '/tree', name: 'Tree', component: Home },
  { path: '/preview', name: 'Preview', component: Preview, props: true },
];
```

### 5.2 路由参数

- `path`: 当前文件夹路径（如 'blog'、'blog/api'）
- 视图模式由路由名称决定

---

## 6. UX 细节与响应式布局

### 6.1 响应式布局
使用 Element Plus 的布局组件：
- 顶部：视图切换器
- 主要内容区：面包屑 + 资源列表
- 支持移动端适配

### 6.2 加载提示与空状态
- 使用 `el-skeleton` 显示加载状态
- 资源为空时显示友好提示

### 6.3 错误提示
使用 `ErrorAlert` 组件统一处理错误。

---

## 7. 部署方案

### 7.1 开发运行
- 安装依赖：`npm install`
- 启动开发服务器：`npm run dev`
- 默认访问：`http://localhost:5175`（代理到后端）

### 7.2 生产构建
- 构建静态文件：`npm run build`
- 结果输出在 `dist/` 目录
- 可部署到后端服务器

### 7.3 部署建议
- 前后端统一部署，避免跨域
- 使用 Vite 代理配置开发环境

---

## 8. 核心功能实现

### 8.1 视图模式切换
- 路由驱动，无需额外状态
- 列表模式：层级显示，支持展开/折叠
- 树状图模式：完整树形结构，默认展开

### 8.2 文件夹导航
- 面包屑显示当前路径
- 点击文件夹更新路由 query.path
- 支持前进后退

### 8.3 数据处理
- 后端返回扁平数据，前端构建树形结构
- 相对路径转换，确保导航正确
- 缓存机制优化性能

---

> 本方案侧重“即刻可用”的前端实现路径，同时保留良好扩展能力；可根据实际业务需求进一步扩展鉴权、权限控制、文件上传与管理等高级功能。