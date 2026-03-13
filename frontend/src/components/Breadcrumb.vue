<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item @click="goToRoot">{{ currentDisk?.name || '根目录' }}</el-breadcrumb-item>
    <el-breadcrumb-item
      v-for="(part, index) in pathParts"
      :key="index"
      @click="goToPath(index)"
    >
      {{ part }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../store/useAppStore';

const route = useRoute();
const router = useRouter();
const store = useAppStore();

const currentDisk = computed(() => store.disks.find(d => d.id === store.currentDiskId));
const currentPath = computed(() => route.query.path || '');
const pathParts = computed(() => (currentPath.value ? currentPath.value.split('/') : []));

const goToRoot = () => {
  router.replace({ name: route.name, query: {} });
};

const goToPath = (index) => {
  const newPath = pathParts.value.slice(0, index + 1).join('/');
  router.replace({ name: route.name, query: { path: newPath } });
};
</script>

<style scoped>
.el-breadcrumb {
  margin-bottom: 10px;
}
</style>