<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <div class="content-wrapper">
        <h1>新闻实时动态变化分析系统</h1>
        <div class="info-container">
          <span>指导老师：朱宏明</span>
          <span>2253092 代仲杰</span>
          <span>2251639 郝明阳</span>
          <span>2251657 李若冰</span>
          <span>2253230 张正阳</span>
          <span>前端仓库地址：<a href="https://github.com/Haookok/BI-frontend" target="_blank">https://github.com/Haookok/BI-frontend</a></span>
          <span>后端仓库地址：<a href="https://github.com/Haookok/BusinessIntelligence" target="_blank">https://github.com/Haookok/BusinessIntelligence</a></span>
        </div>
      </div>
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.content-wrapper {
  text-align: center;
}

.main-content h1 {
  color: #000;
  margin-bottom: 40px;
  font-size: 48px;
  font-weight: bold;
}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-container span {
  font-size: 18px;
  line-height: 1.5;
}

.info-container a {
  color: #000000;
  text-decoration: none;
  transition: color 0.3s ease;
}

.info-container a:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>
