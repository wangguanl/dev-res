<template>
  <div class="home">
    <div class="controls">
      <DiskSelector />
      <el-radio-group v-model="category" size="small" class="category-group">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="video">视频</el-radio-button>
        <el-radio-button label="audio">音频</el-radio-button>
        <el-radio-button label="pdf">PDF</el-radio-button>
        <el-radio-button label="other">其他</el-radio-button>
      </el-radio-group>
    </div>

    <ErrorAlert :message="error" @closed="error = ''" />

    <el-skeleton v-if="loading" :rows="4" animated />

    <ResourceGrid
      v-else
      :items="resources.items"
      :total="resources.total"
      :page="resources.page"
      :pageSize="resources.pageSize"
      :diskId="currentDiskId"
      @update:page="onPageChange"
    />
  </div>
</template>

<script setup>
import { watch, onMounted, ref, computed } from 'vue';
import { useAppStore } from '../store/useAppStore';
import { fetchDisks } from '../api/disks';
import { fetchResources } from '../api/resources';

import DiskSelector from '../components/DiskSelector.vue';
import ResourceGrid from '../components/ResourceGrid.vue';
import ErrorAlert from '../components/ErrorAlert.vue';

const store = useAppStore();

const disks = computed(() => store.disks);
const currentDiskId = computed({
  get: () => store.currentDiskId,
  set: (v) => (store.currentDiskId = v),
});
const category = computed({
  get: () => store.category,
  set: (v) => (store.category = v),
});
const resources = computed(() => store.resources);
const loading = computed(() => store.loading);

const error = ref('');

const loadDisks = async () => {
  try {
    store.loading = true;
    const res = await fetchDisks();
    store.setDisks(res.data || []);
    if (store.currentDiskId) {
      await loadResources();
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    store.loading = false;
  }
};

const loadResources = async () => {
  try {
    store.loading = true;
    const res = await fetchResources({
      diskId: store.currentDiskId,
      category: store.category,
      page: store.resources.page,
      pageSize: store.resources.pageSize,
    });

    // 只更新字段，避免替换整个对象导致 watch 触发循环
    store.resources.total = res.data.total;
    store.resources.items = res.data.items;
  } catch (err) {
    error.value = err.message;
  } finally {
    store.loading = false;
  }
};

const onPageChange = (val) => {
  store.resources.page = val;
};

watch(
  () => [store.currentDiskId, store.category, store.resources.page],
  () => {
    if (store.currentDiskId) {
      loadResources();
    }
  }
);

onMounted(() => {
  loadDisks();
});
</script>

<style scoped>
.home {
  width: 100%;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.category-group {
  margin-left: auto;
}
</style>
