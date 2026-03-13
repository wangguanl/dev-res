<template>
  <el-select v-model="value" placeholder="选择硬盘" style="min-width: 180px" @change="onChange">
    <el-option
      v-for="disk in disks"
      :key="disk.id"
      :label="disk.name"
      :value="disk.id"
    />
  </el-select>
</template>

<script setup>
import { computed } from 'vue';
import { useAppStore } from '../store/useAppStore';

const store = useAppStore();

const value = computed({
  get: () => store.currentDiskId,
  set: (v) => (store.currentDiskId = v),
});

const disks = computed(() => store.disks);

const onChange = () => {
  store.error = null;
};
</script>
