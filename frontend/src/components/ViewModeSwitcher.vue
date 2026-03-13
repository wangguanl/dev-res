<template>
  <div class="view-mode-switcher">
    <el-button-group>
      <el-button
        :type="isList ? 'primary' : ''"
        @click="goList"
      >
        <el-icon><List /></el-icon>
        列表
      </el-button>
      <el-button
        :type="isTree ? 'primary' : ''"
        @click="goTree"
      >
        <el-icon><Folder /></el-icon>
        树状
      </el-button>
    </el-button-group>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { List, Folder } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const isList = computed(() => route.name === 'List');
const isTree = computed(() => route.name === 'Tree');

const goList = () => {
  if (!isList.value) router.push({ name: 'List' });
};

const goTree = () => {
  if (!isTree.value) router.push({ name: 'Tree' });
};
</script>

<style scoped>
.view-mode-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
