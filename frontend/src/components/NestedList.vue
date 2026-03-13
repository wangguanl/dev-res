<template>
  <ul class="nested-list">
    <li v-for="node in nodes" :key="node.relativePath" :class="node.type === 'folder' ? 'folder' : 'file'">
      <div class="node-row">
        <span
          v-if="node.type === 'folder'"
          class="node-toggle"
          @click="toggle(node.relativePath)"
        >
          <el-icon>
            <component :is="isExpanded(node.relativePath) ? ArrowDown : ArrowRight" />
          </el-icon>
        </span>
        <span v-else class="node-placeholder"></span>

        <span
          class="node-name"
          @click="node.type === 'folder' ? enterFolder(node) : preview(node)"
        >
          <el-icon v-if="node.type === 'folder'"><Folder /></el-icon>
          <el-icon v-else><Document /></el-icon>
          {{ node.name }}
        </span>

        <span class="node-meta" v-if="node.type !== 'folder'">
          {{ formatSize(node.size) }}
        </span>
      </div>

      <NestedList
        v-if="node.type === 'folder' && isExpanded(node.relativePath) && node.children?.length"
        :nodes="node.children"
        :preview="preview"
        :enterFolder="enterFolder"
        :expanded.sync="expanded"
      />
    </li>
  </ul>
</template>

<script setup>
import { defineProps, defineEmits, defineOptions, toRefs } from 'vue';
import { Folder, Document, ArrowRight, ArrowDown } from '@element-plus/icons-vue';

defineOptions({
  name: 'NestedList',
});

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  preview: { type: Function, required: true },
  enterFolder: { type: Function, required: true },
  expanded: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:expanded']);

const { nodes, preview, enterFolder, expanded } = toRefs(props);

const isExpanded = (path) => expanded.value.includes(path);

const toggle = (path) => {
  const list = [...expanded.value];
  const idx = list.indexOf(path);
  if (idx === -1) {
    list.push(path);
  } else {
    list.splice(idx, 1);
  }
  emit('update:expanded', list);
};

const formatSize = (size) => {
  if (size == null) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
};
</script>

<style scoped>
.nested-list {
  list-style: none;
  padding-left: 12px;
  margin: 0;
}

.node-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.node-toggle {
  cursor: pointer;
  width: 20px;
  display: flex;
  justify-content: center;
}

.node-placeholder {
  width: 20px;
}

.node-name {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex: 1;
}

.node-meta {
  color: #909399;
  font-size: 12px;
}
</style>
