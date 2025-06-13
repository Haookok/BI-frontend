<template>
<div class="home-layout">
    <Sidebar />
    <div class="main-content">
        <h1 class="mb-6">爆款新闻</h1>
        <div class="popular-news-layout">
            <el-tabs v-model="activeName" class="demo-tabs">
                <el-tab-pane label="综合热度" name="first">
                    <div class="options-panel">
                        <div class="option-input-container">
                            <p>查询时间</p>
                            <el-date-picker v-model="value1" type="datetime" 
                              format="YYYY/MM/DD HH:mm:ss"
                              value-format="YYYY-MM-DD HH:mm:ss"
                              placeholder="选择截止时间" 
                              style="width: 200px; height: 40px; margin-left: 16px;" />
                        </div>
                        <el-button type="primary" class="option-btn" @click="fetchData">查询热门新闻</el-button>
                    </div>
                    <el-table
                      v-if="newsList.length"
                      :data="newsList"
                      border
                      style="width: 100%; margin-top: 24px;"
                    >
                      <el-table-column prop="newsId" label="新闻ID" width=257 />
                      <el-table-column prop="category" label="分类" width=257 />
                      <el-table-column prop="totalBrowseCount" label="总浏览量" width=257 />
                      <el-table-column prop="totalDuration" label="总浏览时长" width=257 />
                      <el-table-column prop="avgBrowseDuration" label="平均浏览时长" width=257>
                        <template #default="scope">
                          {{ scope.row.avgBrowseDuration ? scope.row.avgBrowseDuration.toFixed(2) : '-' }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="growthRate" label="增长率" width="257">
                        <template #default="scope">
                          {{ scope.row.growthRate ?? '-' }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="comprehensiveHeat" label="综合热度" width="257">
                        <template #default="scope">
                          {{ scope.row.comprehensiveHeat ? scope.row.comprehensiveHeat.toFixed(2) : '-' }}
                        </template>
                      </el-table-column>
                    </el-table>
                    <div v-else class="empty-table">暂无热门新闻数据</div>
                </el-tab-pane>
                <el-tab-pane label="趋势分析" name="second">
                    <div class="options-panel">
                        <div class="option-input-container">
                            <p>新闻ID</p>
                            <el-input v-model="newsId" placeholder="请输入新闻ID" style="width: 200px; height: 40px; margin-left: 16px; margin-right: 16px; " />
                            <p>查询时间</p>
                            <el-date-picker v-model="value1" type="datetime" 
                              format="YYYY/MM/DD HH:mm:ss"
                              value-format="YYYY-MM-DD HH:mm:ss"
                              placeholder="选择截止时间" 
                              style="width: 200px; height: 40px; margin-left: 16px;" />
                        </div>
                        <el-button type="primary" class="option-btn" @click="fetchTrendData">查询热度趋势</el-button>
                    </div>
                    <div class="trend-chart-container">
                      <div class="trend-chart"></div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

const activeName = ref('first')
const value1 = ref('')
const newsId = ref('')
const newsList = ref([])
const trendData = ref([])
let trendChartInstance = null

const fetchData = async () => {
  try {
    const params = {}
    if (value1.value) {
      params.timestamp = value1.value
    }
    const res = await axios.get('http://localhost:8080/api/news-analysis/top-hot-news', { params })
    console.log('后端返回数据:', res.data)
    newsList.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    newsList.value = []
    console.error('查询热门新闻失败:', error)
  }
}

const fetchTrendData = async () => {
  if (!newsId.value || !value1.value) return
  try {
    const url = `http://localhost:8080/api/news-analysis/news-trend/${newsId.value}`
    const params = { timestamp: value1.value }
    const res = await axios.get(url, { params })
    trendData.value = Array.isArray(res.data) ? res.data : []
    await nextTick()
    renderTrendChart()
  } catch (error) {
    trendData.value = []
    if (trendChartInstance) trendChartInstance.clear()
    console.error('查询趋势数据失败:', error)
  }
}

function renderTrendChart() {
  const dom = document.querySelector('.trend-chart')
  if (!dom) return
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(dom)
  }
  const xData = trendData.value.map(item => item.date)
  const yData = trendData.value.map(item => item.dailyHeat)
  const option = {
    title: { text: '新闻热度趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      name: '热度'
    },
    series: [
      {
        data: yData,
        type: 'bar',
        name: '每日热度',
        itemStyle: { color: '#409EFF' }
      },
      {
        data: yData,
        type: 'line',
        name: '热度曲线',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#FF9900', width: 3 },
        itemStyle: { color: '#FF9900' }
      }
    ]
  }
  trendChartInstance.setOption(option)
  window.addEventListener('resize', () => {
    trendChartInstance && trendChartInstance.resize()
  })
}

// 切换tab时清空趋势图
watch(activeName, (val) => {
  if (val !== 'second' && trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})

onMounted(() => {
  // 可选：初始化时加载数据
})
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
:deep(.el-tabs__item) {
  font-size: 16px;
}
.popular-news-layout {
  width: 100%;
}
.options-panel {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  padding: 16px 24px;
  margin-bottom: 24px;
}
.option-input-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 16px;
}
.option-input-container p{
  font-size: 16px;
}
.option-input-container p {
  margin: 0 8px 0 0;
  white-space: nowrap;
}
.option-btn {
  min-width: 120px;
  height: 40px;
}
.news-list {
  margin-top: 16px;
}
.news-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 3px;
  background: #fafbfc;
}
.news-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}
.news-category {
  color: #666;
  font-size: 0.9em;
}
.empty-table {
  color: #888;
  font-size: 16px;
  margin: 20px 0;
  text-align: center;
}
:deep(.el-table__row) {
  height: 80px;
}
:deep(.el-table__cell) {
  vertical-align: middle;
  text-align: center;
  font-size: 15px;
}
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}


.trend-chart-container {
  width: 100%;
  height: 900px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
}
.trend-chart {
  width: 100%;
  height: 100%;
}
</style>