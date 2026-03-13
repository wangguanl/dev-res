# 前端分离接口规划（Node.js + Win10 多硬盘资源共享）

本接口规划在前后端分离架构下，统一定义后端对外提供的 REST API 以及前端应如何调用与处理返回数据。接口均以 `http://<host>:<port>/api/...` 为基准路径。

---

## 1. 通用约定

### 1.1 请求格式
- 所有接口必须使用 HTTPS（生产环境）或 HTTP（局域网测试）
- 请求参数通过 `query` 或 `path` 传递，必要时使用 JSON body
- 前端请求时需携带 `Accept: application/json`、`Content-Type: application/json`（POST/PUT/DELETE）
- 跨域：后端开启 CORS（允许局域网 IP / 指定前端域名）

### 1.2 响应格式
统一返回 JSON：
```json
{
  "code": 0,
  "message": "success",
  "data": {...}
}
```
- `code`: 状态码，0 表示成功，非 0 表示失败
- `message`: 错误信息或提示信息
- `data`: 成功时返回的数据结构

### 1.3 错误码（示例）
| code | 说明 |
|------|------|
| 0 | 成功 |
| 1001 | 参数不合法 |
| 1002 | 硬盘未找到 / 未配置 |
| 1003 | 路径越权（非法访问） |
| 1004 | 文件/目录不存在 |
| 1005 | 读取文件异常 |
| 1006 | 内部服务错误 |

---

## 2. 接口列表

### 2.1 获取硬盘列表

- **接口**：`GET /api/disks`
- **描述**：返回后端配置的硬盘白名单，用于前端初始化硬盘选择。

#### 请求
- 无

#### 响应示例
```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": "disk1", "name": "视频", "path": "D:/视频" },
    { "id": "disk2", "name": "音频", "path": "E:/音频" },
    { "id": "disk3", "name": "PDF", "path": "F:/PDF" }
  ]
}
```

---

### 2.2 获取资源分类列表

- **接口**：`GET /api/disks/:diskId/resources`
- **描述**：根据硬盘与分类（可选）返回该硬盘下指定目录的资源列表。

#### 请求参数
- `diskId` (path) - 硬盘 ID
- `category` (query, optional) - 资源分类：`video` / `audio` / `pdf` / `other` / `all`（默认 `all`）
- `folder` (query, optional) - 相对目录路径（例如 `电影/2024`），不允许 `..`
- `page` (query, optional) - 分页页码，默认 1
- `pageSize` (query, optional) - 每页数量，默认 50

#### 响应字段
- `total`：总条数
- `page`：当前页
- `pageSize`：每页数量
- `items`: 资源数组

#### 资源对象示例
```json
{
  "name": "示例.mp4",
  "relativePath": "电影/示例.mp4",
  "size": 123456789,
  "mtime": 1690000000000,
  "type": "video",
  "mime": "video/mp4",
  "previewUrl": "/api/files/stream?diskId=disk1&path=电影/示例.mp4"
}
```

---

### 2.3 文件流预览 / 下载

- **接口**：`GET /api/files/stream`
- **描述**：提供文件流数据，支持浏览器直接预览及下载。支持 `Range` 请求用于断点续传/视频播放。

#### 请求参数（query）
- `diskId`：硬盘 ID
- `path`：相对路径（例如 `电影/示例.mp4`）

#### 响应特性
- 支持 `Content-Type` 对应文件类型（根据后缀映射）
- 支持 `Content-Disposition`：对于下载可以设置 `attachment; filename="..."`
- 支持 `Accept-Ranges: bytes` / `Content-Range` / `206 Partial Content`

---

### 2.4 搜索资源（可选）

- **接口**：`GET /api/search`
- **描述**：在指定硬盘及分类内按文件名模糊搜索。

#### 请求参数
- `diskId`：硬盘 ID
- `q`：搜索关键词
- `category`：分类（可选）
- `folder`：相对目录，限定搜索范围（可选）

#### 响应示例
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "name": "示例.mp4",
      "relativePath": "电影/示例.mp4",
      "type": "video",
      "size": 123456789,
      "mtime": 1690000000000,
      "previewUrl": "/api/files/stream?diskId=disk1&path=电影/示例.mp4"
    }
  ]
}
```

---

## 3. 前端调用注意点

- **路径编码**：在构造 `path` 字段时，使用 `encodeURIComponent` 防止中文 / 特殊字符导致请求失败。
- **分页**：列表接口支持分页，前端可根据场景做“加载更多”或分页展示。
- **错误处理**：后端返回非 0 `code` 时，将 `message` 显示给用户，并在控制台打印详细堆栈（开发环境）。
- **缓存策略**：可在前端对 `硬盘列表`、`目录列表` 做简单缓存（如 localStorage），避免频繁重载。

---

## 4. API 扩展建议（可选）

- **鉴权/令牌**：添加简单的访问令牌（`Authorization: Bearer <token>`），避免开放式访问
- **上传接口**：`POST /api/files/upload` 支持 multipart/form-data 上传到指定目录
- **文件夹结构**：`GET /api/disks/:diskId/tree` 返回目录树结构用于侧边栏导航
- **操作接口**：重命名、删除、创建文件夹等管理功能（谨慎开放）

---

> 以上接口规划可作为前后端协作的契约文档，后端实现时建议严格校验输入路径、做好异常处理并在日志中保留关键请求数据以便排查问题。