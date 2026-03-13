<template>
  <el-alert
    v-if="message"
    title="错误"
    type="error"
    :description="message"
    show-icon
    closable
    @close="onClose"
  />
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  message: { type: String, default: '' },
});

const emit = defineEmits(['closed']);

const onClose = () => {
  emit('closed');
};
</script>
