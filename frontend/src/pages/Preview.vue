<template>
  <div class="preview">
    <el-card>
      <div class="preview-header">
        <div class="title">{{ name }}</div>
        <div class="actions">
          <el-button type="primary" @click="download">下载</el-button>
          <el-button @click="openInNewPage">新页面打开</el-button>
          <el-button @click="goBack">返回</el-button>
        </div>
      </div>

      <div class="preview-body">
        <template v-if="type === 'video'">
          <video controls autoplay :src="streamUrl" class="full" />
        </template>
        <template v-else-if="type === 'audio'">
          <audio controls :src="streamUrl" class="full" />
        </template>
        <template v-else-if="type === 'pdf'">
          <iframe :src="pdfUrl" class="full" />
        </template>
        <template v-else-if="isImage">
          <img :src="streamUrl" :alt="name" class="image-preview" />
        </template>
        <template v-else-if="isBrowserPreviewable">
          <iframe :src="streamUrl" class="full" />
        </template>
        <template v-else>
          <div class="unsupported">
            暂不支持预览此类型文件，可点击下载查看。
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const diskId = route.query.diskId || '';
const path = route.query.path || '';
const type = route.query.type || 'other';
const name = route.query.name || '';
const apiBaseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const imageExtSet = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif', 'ico']);
const browserPreviewExtSet = new Set(['txt', 'md', 'json', 'xml', 'html', 'htm', 'csv', 'log']);

const streamUrl = computed(() => {
  if (!diskId || !path) return '';
  return `${apiBaseURL}/files/stream?diskId=${encodeURIComponent(diskId)}&path=${encodeURIComponent(path)}`;
});

const fileExt = computed(() => {
  const target = String(path || name || '');
  const clean = target.split('?')[0];
  const idx = clean.lastIndexOf('.');
  return idx === -1 ? '' : clean.slice(idx + 1).toLowerCase();
});

const isImage = computed(() => type === 'image' || imageExtSet.has(fileExt.value));
const isBrowserPreviewable = computed(() => browserPreviewExtSet.has(fileExt.value));

const pdfUrl = computed(() => {
  return streamUrl.value;
});

const download = () => {
  if (!streamUrl.value) return;
  window.open(streamUrl.value + '&download=1', '_blank');
};

const openInNewPage = () => {
  if (!streamUrl.value) return;
  window.open(streamUrl.value, '_blank');
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-body {
  min-height: 400px;
}

.full {
  width: 100%;
  height: 100%;
  border: 0;
}

.image-preview {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
}

.unsupported {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-regular);
}
</style>
