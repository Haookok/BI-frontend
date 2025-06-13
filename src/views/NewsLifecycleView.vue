<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <h1 class="mb-6">新闻生命周期</h1>
      <div class="news-lifecycle-layout">
        <!-- 左侧选项区 -->
        <div class="options-panel">
          <div class="option-input-container">
            <p>用户ID</p>
            <el-input v-model="userId" placeholder="请输入用户ID" class="option-input" />
          </div>
        
          <div class="option-date-picker-container">
            <p>选择开始时间</p>
            <el-date-picker
              v-model="startTime"
              type="datetime"
              placeholder="Pick a Date"
              format="YYYY/MM/DD HH:mm:ss"
              date-format="YYYY/MM/DD ddd"
              time-format="A hh:mm:ss"
              value-format="x"
              class="option-date-picker"
            />
          </div>
          <div class="option-date-picker-container">
            <p>选择结束时间</p>
            <el-date-picker
              v-model="endTime"
              type="datetime"
              placeholder="Pick a Date"
              format="YYYY/MM/DD HH:mm:ss"
              date-format="YYYY/MM/DD ddd"
              time-format="A hh:mm:ss"
              value-format="x"
              class="option-date-picker"
            />
          </div>
          <el-button type="primary" class="option-btn" @click="fetchData">查询</el-button>
        </div>
        <!-- 右侧图表区 -->
        <div class="chart-panel">
          <el-card class="chart-card">
            <h4>新闻生命周期趋势图</h4>
            <ve-line 
              :key="chartDataKey" 
              :data="chartData"
              :data-zoom="chartDataZoom"
              :set-option-opts="false">
            </ve-line>
          </el-card>
        </div>
      </div>    
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref, onMounted } from 'vue'
import axios from 'axios'

const userId = ref('')
const startTime = ref('')
const endTime = ref('')

// 图表相关数据
const chartData = ref({
  columns: ['Timestamp', '浏览数', '评论数', '点赞数'],
  rows: []
})
const chartDataKey = ref(0)
const chartDataZoom = ref([{ type: "slider" }])

// 获取图表数据的方法
const fetchChartData = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/news/statistics/lifecycle', {
      params: {
        startTime: startTime.value ? Math.floor(parseInt(startTime.value) / 1000) : null,
        endTime: endTime.value ? Math.floor(parseInt(endTime.value) / 1000) : null,
        userId: userId.value || null
      }
    })
    
    // 处理返回的数据
    const data = res.data
    if (data && data.length > 0) {
      const rows = data.map(item => ({
        Timestamp: new Date(item.timestamp * 1000).toLocaleString(),
        '浏览数': item.browseCount,
        '评论数': item.commentCount,
        '点赞数': item.likeCount
      }))
      
      chartData.value = {
        columns: ['Timestamp', '浏览数', '评论数', '点赞数'],
        rows: rows
      }
      
      // 强制更新图表
      chartDataKey.value++
    }
  } catch (error) {
    console.error('获取图表数据失败:', error)
  }
}

// 在组件挂载时获取数据
onMounted(() => {
  fetchChartData()
})

const fetchData = async () => {
  try {
    await fetchChartData()
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}
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

.news-lifecycle-layout {
  display: flex;
  height: 100%;
}

.chart-panel {
  width: 70%;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-card {
  width: 100%;
  height: 100%;
}

.chart-card h4 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.2em;
}

.options-panel {
  width: 30%;
  min-width: 220px;
  max-width: 400px;
  height: 37%;
  padding: 32px 16px 32px 16px;
  display: flex;
  gap: 1.5vw;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  margin-top: 15%;
}

.option-date-picker-container {
  width: 100%;
  box-sizing: border-box;
}

.option-date-picker {
  width: 100%;
  display: block;
  box-sizing: border-box;
}

.option-input {
  width: 100%;
  height: 2vw;
}

.option-btn {
  width: 100%;
  height: 2vw;
  min-height: 40px;
}

::v-deep(.option-date-picker .el-input) {
  width: 100%;
}

::v-deep(.option-date-picker .el-input__wrapper) {
  min-height: 40px;
  height: 40px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

::v-deep(.option-date-picker .el-input__inner) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
</style> 