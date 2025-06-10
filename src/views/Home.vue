<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <h1>欢迎来到首页</h1>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
</script>

<style scoped>
.home-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.main-content {
  flex: 1;
  background: #f5f6fa;
  padding: 32px;
  overflow: auto;
}
</style>
