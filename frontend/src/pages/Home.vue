<template>
  <el-container style="height: calc(100vh - 56px);">
    <el-header height="auto" style="padding: 10px; border-bottom: 1px solid #e4e7ed;">
      <div class="header-controls">
        <Breadcrumb v-if="viewMode === 'list'" />
      </div>
    </el-header>

    <el-main style="padding: 16px;">
      <ErrorAlert :message="error" @closed="error = ''" />

      <el-skeleton v-if="loading" :rows="4" animated />

      <ResourceGrid
        v-else
        :items="resources.items"
        :total="resources.total"
        :page="resources.page"
        :pageSize="resources.pageSize"
        :diskId="currentDiskId"
        :viewMode="viewMode"
        :currentFolder="currentFolder"
        @update:page="onPageChange"
      />
    </el-main>
  </el-container>
</template>

<script setup>
import { watch, onMounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../store/useAppStore';
import { fetchDisks } from '../api/disks';
import { fetchResources } from '../api/resources';

import Breadcrumb from '../components/Breadcrumb.vue';
import ResourceGrid from '../components/ResourceGrid.vue';
import ErrorAlert from '../components/ErrorAlert.vue';

const router = useRouter();
const route = useRoute();

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
const viewMode = computed(() => {
  const name = route.name;
  return name === 'Tree' ? 'tree' : 'list';
});
const resources = computed(() => store.resources);
const loading = computed(() => store.loading);

const currentFolder = computed(() => route.query.path || '');

const error = ref('');

const loadDisks = async () => {
  try {
    store.loading = true;
    const res = await fetchDisks();
    store.setDisks(res.data || []);
    // 移除这里的 loadResources 调用，让 watch 处理
  } catch (err) {
    error.value = err.message;
  } finally {
    store.loading = false;
  }
};

const loadResources = async (folder) => {
  try {
    store.loading = true;
    const res = await fetchResources({
      diskId: store.currentDiskId,
      category: store.category,
      folder: folder || '',
      page: store.resources.page,
      pageSize: store.resources.pageSize,
      mode: viewMode.value === 'tree' ? 'tree' : 'list',
    });

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
  () => [store.currentDiskId, store.category, currentFolder.value, store.resources.page, route.name],
  () => {
    if (store.currentDiskId) {
      loadResources(currentFolder.value);
    }
  }
);

watch(
  () => currentFolder.value,
  (newPath) => {
    store.setCurrentFolder(newPath || '');
  }
);

onMounted(() => {
  loadDisks();
});
</script>

<style scoped>
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>