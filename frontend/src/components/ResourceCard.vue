<template>
  <el-card :body-style="{ padding: '12px' }" class="resource-card">
    <div class="card-header">
      <span class="file-name" :title="resource.name">{{ resource.name }}</span>
      <el-button type="text" icon="el-icon-download" size="small" @click.stop="download">
        下载
      </el-button>
    </div>

    <div class="card-meta">
      <span>{{ formatSize(resource.size) }}</span>
      <span>{{ formatTime(resource.mtime) }}</span>
    </div>

    <div class="card-actions">
      <el-button type="primary" size="mini" @click="preview">预览</el-button>
    </div>
  </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  resource: { type: Object, required: true },
  diskId: { type: String, required: true },
});

const router = useRouter();

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

const preview = () => {
  router.push({
    name: 'Preview',
    query: {
      diskId: props.diskId,
      path: props.resource.relativePath,
      type: props.resource.type,
      name: props.resource.name,
    },
  });
};

const download = () => {
  const url = `/api/files/stream?diskId=${encodeURIComponent(props.diskId)}&path=${encodeURIComponent(
    props.resource.relativePath
  )}&download=1`;
  window.open(url, '_blank');
};
</script>

<style scoped>
.resource-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 160px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.card-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  justify-content: space-between;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
