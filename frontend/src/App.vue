<template>
  <el-container style="height: 100vh;">
    <el-header height="56px">
      <div class="app-header">
        <span class="logo">NASUI 资源共享</span>
        <span class="hint">局域网访问 + 视频/音频/PDF 预览</span>
      </div>
    </el-header>

    <el-main style="padding: 16px;">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.logo {
  font-weight: 700;
  font-size: 18px;
}

.hint {
  font-size: 12px;
  color: var(--el-color-text-2);
}
</style>
