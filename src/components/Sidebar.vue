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
        <el-icon><Compass /></el-icon>
        <span>统计查询</span>
      </template>
      <el-menu-item index="2-1" @click="handleSelect('lifecycle')">新闻生命周期</el-menu-item>
      <el-menu-item index="2-2" @click="handleSelect('type')">不同种类新闻统计</el-menu-item>
      <el-menu-item index="2-3" @click="handleSelect('userinterest')">用户兴趣</el-menu-item>
    </el-sub-menu>

    <el-menu-item index="3" @click="handleSelect('complex')">
      <el-icon><Search /></el-icon>
      <template #title>综合查询</template>
    </el-menu-item>

    <el-sub-menu index="4">
      <template #title>
        <el-icon><Document /></el-icon>
        <span>新闻分析</span>
      </template>
      <el-menu-item index="4-1" @click="handleSelect('popular')">爆款新闻</el-menu-item>
      <el-menu-item index="4-2" @click="handleSelect('recommendation')">新闻推荐</el-menu-item>
    </el-sub-menu>

    <el-menu-item index="5" @click="handleSelect('queryLog')">
      <el-icon><Setting /></el-icon>
      <template #title>搜索日志</template>
    </el-menu-item>

    
  </el-menu>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router' // 引入路由钩子
import { Monitor, Document, Setting } from '@element-plus/icons-vue'

const router = useRouter() // 获取路由实例
const route = useRoute() // 获取当前路由
const activeIndex = ref('1')
const isCollapse = ref(false)

// 路由name与菜单index的映射
const routeToIndex = {
  'Home': '1',
  'NewsLifecycle': '2-1',
  'NewsType': '2-2',
  'UserInterest': '2-3',
  'ComplexQuery': '3',
  'PopularNews': '4-1',
  'NewsRecommendation': '4-2',
  'QueryLogs': '5',
  
}

// 根据当前路由自动设置activeIndex
const setActiveByRoute = () => {
  const idx = routeToIndex[route.name]
  if (idx) activeIndex.value = idx
}
setActiveByRoute()

watch(() => route.name, setActiveByRoute)

const handleSelect = (key) => {
  console.log('handleSelect called with:', key)
  // 根据 key 进行路由导航
  switch(key) {
    case 'dashboard':
      router.push({ name: 'Home' })
      activeIndex.value = '1'
      break
    case 'lifecycle':
      router.push({ name: 'NewsLifecycle' })
      activeIndex.value = '2-1'
      break
    case 'type':
      router.push({ name: 'NewsType' })
      activeIndex.value = '2-2'
      break
    case 'popular':
      router.push({ name: 'PopularNews' })
      activeIndex.value = '4-1'
      break
    case 'recommendation':
      router.push({ name: 'NewsRecommendation' })
      activeIndex.value = '4-2'
      break
    case 'queryLog':
      router.push({ name: 'QueryLogs' })
      activeIndex.value = '5'
      break
    case 'userinterest':
      router.push({ name: 'UserInterest' })
      activeIndex.value = '2-3'
      break
    case 'complex':
      router.push({ name: 'ComplexQuery' })
      activeIndex.value = '3'
      break
  }
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