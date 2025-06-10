<template>
  <el-menu
    :default-active="activeIndex"
    class="sidebar-menu"
    :collapse="isCollapse"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
  >
    

    <el-menu-item index="1" @click="handleSelect('dashboard')">
      <el-icon><Monitor /></el-icon>
      <template #title>仪表盘</template>
    </el-menu-item>

    <el-sub-menu index="2">
      <template #title>
        <el-icon><Document /></el-icon>
        <span>数据管理</span>
      </template>
      <el-menu-item index="2-1" @click="handleSelect('data-analysis')">数据分析</el-menu-item>
      <el-menu-item index="2-2" @click="handleSelect('data-visualization')">数据可视化</el-menu-item>
    </el-sub-menu>

    <el-menu-item index="3" @click="handleSelect('reports')">
      <el-icon><PieChart /></el-icon>
      <template #title>报表中心</template>
    </el-menu-item>

    <el-menu-item index="4" @click="handleSelect('settings')">
      <el-icon><Setting /></el-icon>
      <template #title>系统设置</template>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { ref } from 'vue'
import { Monitor, Document, PieChart, Setting } from '@element-plus/icons-vue'

const activeIndex = ref('1')
const isCollapse = ref(false)

const handleSelect = (key) => {
  console.log('Selected:', key)
  // 这里可以添加路由导航逻辑
}
</script>

<style scoped>
.sidebar-menu {
  height: 100vh;
  border-right: none;
  width: 260px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.el-menu-item, .el-sub-menu {
  &:hover {
    background-color: #263445 !important;
  }
}

.el-menu-item.is-active {
  background-color: #263445 !important;
}

:deep(.el-menu-item), :deep(.el-sub-menu__title) {
  height: 56px;
  line-height: 56px;
  font-size: 15px;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 260px;
  padding-left: 48px !important;
}
</style>
