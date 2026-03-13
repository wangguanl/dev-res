<template>
  <div class="resource-container">
    <template v-if="viewMode === 'list'">
      <NestedList
        :nodes="treeItems"
        :preview="preview"
        :enterFolder="enterFolder"
        :expanded.sync="expandedFolders"
      />
    </template>

    <template v-else-if="viewMode === 'tree'">
      <el-tree
        :data="treeItems"
        :props="treeProps"
        node-key="relativePath"
        default-expand-all
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="tree-node">
            <el-icon v-if="data.type === 'folder'"><Folder /></el-icon>
            <el-icon v-else><Document /></el-icon>
            <span>{{ node.label }}</span>
            <span v-if="data.type !== 'folder'" class="file-info">
              ({{ formatSize(data.size) }})
            </span>
          </span>
        </template>
      </el-tree>
    </template>

    <div class="pagination" v-if="total > pageSize && viewMode !== 'tree'">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="pageSize"
        :current-page.sync="page"
        :total="total"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Folder, Document } from '@element-plus/icons-vue';
import NestedList from './NestedList.vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 50 },
  diskId: { type: String, required: true },
  viewMode: { type: String, default: 'list' },
  currentFolder: { type: String, default: '' },
});

const emit = defineEmits(['update:page']);

const router = useRouter();
const expandedFolders = ref([]);

const treeProps = {
  label: 'name',
  children: 'children',
};

const treeItems = computed(() => {
  const buildTree = (items) => {
    const prefix = props.currentFolder ? `${props.currentFolder}/` : '';

    // 调整 relativePath 相对于当前文件夹
    const adjustedItems = items.map((item) => ({
      ...item,
      relativePath: item.relativePath.startsWith(prefix) ? item.relativePath.slice(prefix.length) : item.relativePath,
      name: item.relativePath.startsWith(prefix)
        ? item.relativePath.slice(prefix.length).split('/').pop() || item.name
        : item.name,
    }));

    // 去重：后端有时会返回重复的相对路径
    const uniqueItems = Array.from(
      adjustedItems.reduce((map, item) => {
        if (!map.has(item.relativePath)) map.set(item.relativePath, item);
        return map;
      }, new Map()).values()
    );

    const getParentPath = (p) => {
      const idx = p.lastIndexOf('/');
      return idx === -1 ? '' : p.slice(0, idx);
    };

    const folders = new Map();
    const rootItems = [];

    const ensureFolderNode = (relPath) => {
      if (!relPath) return null;
      if (!folders.has(relPath)) {
        const name = relPath.split('/').pop();
        folders.set(relPath, { name, relativePath: relPath, type: 'folder', children: [] });
      }
      return folders.get(relPath);
    };

    // 1) 先收集所有目录节点
    uniqueItems.forEach((item) => {
      if (item.type === 'folder') {
        folders.set(item.relativePath, { ...item, children: [] });
      }
    });

    // 2) 确保中间目录存在（例如 a/b/c 需要 a/b 也存在）
    Array.from(folders.keys()).forEach((relPath) => {
      const parentPath = getParentPath(relPath);
      if (parentPath) {
        ensureFolderNode(parentPath);
      }
    });

    // 3) 将目录挂到父目录下
    folders.forEach((folder, relPath) => {
      const parentPath = getParentPath(relPath);
      if (parentPath) {
        const parent = folders.get(parentPath);
        if (parent) {
          parent.children.push(folder);
        }
      }
    });

    // 4) 将文件挂到对应目录
    uniqueItems.forEach((item) => {
      if (item.type === 'folder') return;
      const parentPath = getParentPath(item.relativePath);
      const node = { ...item };
      if (!parentPath) {
        rootItems.push(node);
      } else {
        const parent = folders.get(parentPath);
        if (parent) {
          parent.children.push(node);
        } else {
          rootItems.push(node);
        }
      }
    });

    const rootFolders = Array.from(folders.values()).filter((folder) => !getParentPath(folder.relativePath));
    return [...rootFolders, ...rootItems];
  };

  return buildTree(props.items);
});


const onPageChange = (val) => {
  emit('update:page', val);
};

const formatSize = (size) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const formatTime = (ms) => {
  const date = new Date(ms);
  return date.toLocaleString();
};

const preview = (resource) => {
  const fullPath = props.currentFolder ? `${props.currentFolder}/${resource.relativePath}` : resource.relativePath;
  router.push({
    name: 'Preview',
    query: {
      diskId: props.diskId,
      path: fullPath,
      type: resource.type,
      name: resource.name,
    },
  });
};

const download = (resource) => {
  const url = `/api/files/stream?diskId=${encodeURIComponent(props.diskId)}&path=${encodeURIComponent(
    resource.relativePath
  )}&download=1`;
  window.open(url, '_blank');
};

const enterFolder = (folder) => {
  const fullPath = props.currentFolder ? `${props.currentFolder}/${folder.relativePath}` : folder.relativePath;
  router.push({
    name: 'List',
    query: { path: fullPath },
  });
};

const handleNodeClick = (data) => {
  if (data.type !== 'folder') {
    preview(data);
  }
};
</script>

<style scoped>
.resource-container {
  margin-top: 16px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-node .el-icon {
  flex-shrink: 0;
}

.file-info {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}

  .resource-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .resource-list li {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #ebeef5;
  }

  .resource-list li.folder {
    background: #fafafa;
  }

  .item-link {
    display: flex;
    align-items: center;
    gap: 8px;
    color: inherit;
    text-decoration: none;
    flex: 1;
  }

  .item-link:hover {
    color: var(--el-color-primary);
  }

  .item-meta {
    color: #909399;
    font-size: 12px;
  }

  .empty {
    text-align: center;
    padding: 20px;
    color: #909399;
  }
</style>

