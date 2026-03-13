<template>
  <el-tree
    :data="treeData"
    :props="treeProps"
    :load="loadNode"
    lazy
    @node-click="handleNodeClick"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../store/useAppStore';
import { fetchResources } from '../api/resources';

const store = useAppStore();

const treeData = ref([]);
const treeProps = {
  label: 'name',
  children: 'children',
  isLeaf: 'isLeaf',
};

const currentDisk = computed(() => store.disks.find(d => d.id === store.currentDiskId));

const loadNode = async (node, resolve) => {
  if (node.level === 0) {
    // 根节点：加载硬盘根目录的文件夹
    if (currentDisk.value) {
      const folders = await loadFolders(currentDisk.value.path, '');
      resolve(folders);
    } else {
      resolve([]);
    }
  } else {
    // 子节点：加载子文件夹
    const folders = await loadFolders(currentDisk.value.path, node.data.relativePath);
    resolve(folders);
  }
};

const loadFolders = async (diskPath, folder) => {
  try {
    const res = await fetchResources({
      diskId: store.currentDiskId,
      category: 'all',
      folder,
      page: 1,
      pageSize: 1000, // 加载更多以获取文件夹
    });
    return res.data.items
      .filter(item => item.type === 'folder')
      .map(item => ({
        name: item.name,
        relativePath: item.relativePath,
        isLeaf: false, // 假设有子文件夹
      }));
  } catch (err) {
    console.error('加载文件夹失败:', err);
    return [];
  }
};

const handleNodeClick = (data) => {
  store.setCurrentFolder(data.relativePath);
};

onMounted(() => {
  if (currentDisk.value) {
    treeData.value = [{
      name: currentDisk.value.name,
      relativePath: '',
      isLeaf: false,
    }];
  }
});
</script>

<style scoped>
.el-tree {
  padding: 10px;
}
</style>