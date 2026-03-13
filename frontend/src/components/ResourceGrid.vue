<template>
  <div class="resource-grid">
    <el-row :gutter="16">
      <el-col
        v-for="item in items"
        :key="item.relativePath"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        :xl="6"
      >
        <ResourceCard :resource="item" :diskId="diskId" />
      </el-col>
    </el-row>

    <div class="pagination" v-if="total > pageSize">
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
import { watch, computed } from 'vue';
import ResourceCard from './ResourceCard.vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 50 },
  diskId: { type: String, required: true },
});

const emit = defineEmits(['update:page']);

const onPageChange = (val) => {
  emit('update:page', val);
};
</script>

<style scoped>
.resource-grid {
  margin-top: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
