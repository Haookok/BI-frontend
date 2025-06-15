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
                            <el-date-picker v-model="comprehensiveDate" type="date" 
                              format="YYYY/MM/DD"
                              value-format="YYYY-MM-DD"
                              placeholder="选择截止时间" 
                              style="width: 200px; height: 40px; margin-left: 16px;" />
                        </div>
                        <el-button type="primary" class="option-btn" @click="fetchData">查询热门新闻</el-button>
                    </div>
                    <div v-if="newsList.length" class="news-list">
                        <div v-for="news in newsList" :key="news.newsId" class="news-item">
                            <div class="news-title" @click="showNewsContent(news)">{{ news.headline || '无标题' }}</div>
                            <div class="news-details">
                                <span class="news-category">分类: {{ news.category || '无分类' }}</span>
                                <span class="news-id">ID: {{ news.newsId }}</span>
                                <span class="news-browse">总浏览量: {{ news.totalBrowseCount }}</span>
                                <span class="news-duration">总浏览时长: {{ news.totalDuration }}s</span>
                                <span class="news-avg-duration">平均浏览时长: {{ news.avgBrowseDuration ? news.avgBrowseDuration.toFixed(2) : '-' }}s</span>
                                <span class="news-growth">增长率: {{ news.growthRate ?? '-' }}</span>
                                <span class="news-heat">综合热度: {{ news.comprehensiveHeat ? news.comprehensiveHeat.toFixed(2) : '-' }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-else class="empty-table">暂无热门新闻数据</div>
                </el-tab-pane>
                <el-tab-pane label="趋势分析" name="second">
                    <div class="options-panel">
                        <div class="option-input-container">
                            <p>新闻ID</p>
                            <el-input v-model="newsId" placeholder="请输入新闻ID" style="width: 200px; height: 40px; margin-left: 16px; margin-right: 16px; " />
                            <p>查询时间</p>
                            <el-date-picker v-model="trendDate" type="datetime" 
                              format="YYYY/MM/DD HH:mm:ss"
                              value-format="YYYY-MM-DD HH:mm:ss"
                              placeholder="选择截止时间" 
                              style="width: 200px; height: 40px; margin-left: 16px;" />
                        </div>
                        <el-button type="primary" class="option-btn" @click="fetchTrendData">查询热度趋势</el-button>
                    </div>
                    <div class="trend-chart-container">
                      <div ref="trendChartRef" class="trend-chart"></div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</div>

<!-- 添加新闻内容弹窗 -->
<el-dialog
    v-model="dialogVisible"
    :title="'新闻详情'"
    width="80%"
    class="news-dialog"
>
    <div class="news-detail-container">
        <h2 class="news-detail-title">{{ selectedNews?.headline || '无标题' }}</h2>
        <div class="news-detail-meta">
            <div class="meta-group">
                <span class="meta-label">基本信息</span>
                <span>ID: {{ selectedNews?.newsId }}</span>
                <span>分类: {{ selectedNews?.category || '无分类' }}</span>
                <span>主题: {{ selectedNews?.topic || '-' }}</span>
            </div>
            <div class="meta-group">
                <span class="meta-label">浏览数据</span>
                <span>总浏览量: {{ selectedNews?.totalBrowseCount || 0 }}</span>
                <span>总浏览时长: {{ selectedNews?.totalDuration || 0 }}s</span>
                <span>平均浏览时长: {{ selectedNews?.avgBrowseDuration ? selectedNews.avgBrowseDuration.toFixed(2) : '-' }}s</span>
            </div>
            <div class="meta-group">
                <span class="meta-label">热度数据</span>
                <span>日热度: {{ selectedNews?.dailyHeat ? selectedNews.dailyHeat.toFixed(2) : '-' }}</span>
                <span>增长率: {{ selectedNews?.growthRate ? (selectedNews.growthRate * 100).toFixed(2) + '%' : '-' }}</span>
                <span>综合热度: {{ selectedNews?.comprehensiveHeat ? selectedNews.comprehensiveHeat.toFixed(2) : '-' }}</span>
            </div>
        </div>
        <div class="news-detail-content">
            {{ selectedNews?.content || '暂无内容' }}
        </div>
    </div>
</el-dialog>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

const activeName = ref('first')
const comprehensiveDate = ref('')  // 综合热度查询的日期
const trendDate = ref('')          // 趋势分析查询的日期
const newsId = ref('')
const newsList = ref([])
const trendData = ref([])
const trendChartRef = ref(null)
const dialogVisible = ref(false)
const selectedNews = ref(null)
let trendChartInstance = null

const fetchData = async () => {
  try {
    const params = {}
    if (comprehensiveDate.value) {
      const date = new Date(comprehensiveDate.value)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      params.targetDate = `${year}-${month}-${day}`
    }
    console.log('请求参数:', params)
    const res = await axios.get('http://localhost:8080/api/news-heat-trend/top10', { 
      params,
      timeout: 5000
    })
    console.log('后端返回数据:', res.data)
    // 处理新的数据结构
    if (res.data && res.data.hotNewsList) {
      newsList.value = res.data.hotNewsList.map(item => ({
        newsId: item.news.newsId,
        headline: item.news.headline,
        content: item.news.content,
        category: item.news.category,
        topic: item.news.topic,
        totalBrowseCount: item.news.totalBrowseNum,
        totalDuration: item.news.totalBrowseDuration,
        dailyHeat: item.dailyHeat,
        growthRate: item.growthRate,
        comprehensiveHeat: item.comprehensiveHeat
      }))
    } else {
      newsList.value = []
    }
  } catch (error) {
    newsList.value = []
    if (error.code === 'ERR_NETWORK') {
      console.error('网络连接失败，请检查后端服务是否启动')
      alert('网络连接失败，请检查后端服务是否启动')
    } else {
      console.error('查询热门新闻失败:', error)
      alert('查询热门新闻失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

const fetchTrendData = async () => {
  if (!newsId.value || !trendDate.value) {
    alert('请输入新闻ID并选择日期')
    return
  }
  try {
    const date = new Date(trendDate.value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    
    const url = `http://localhost:8080/api/news-heat-trend/query`
    const params = { 
      newsId: newsId.value,
      referenceDate: formattedDate
    }
    console.log('请求参数:', params)
    const res = await axios.get(url, { 
      params,
      timeout: 5000
    })
    console.log('趋势数据:', res.data)
    trendData.value = Array.isArray(res.data) ? res.data : []
    
    await nextTick()
    if (trendData.value.length > 0) {
      renderTrendChart()
    } else {
      if (trendChartInstance) {
        trendChartInstance.clear()
      }
    }
  } catch (error) {
    trendData.value = []
    if (trendChartInstance) {
      trendChartInstance.clear()
    }
    if (error.code === 'ERR_NETWORK') {
      console.error('网络连接失败，请检查后端服务是否启动')
      alert('网络连接失败，请检查后端服务是否启动')
    } else {
      console.error('查询趋势数据失败:', error)
      alert('查询趋势数据失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

function renderTrendChart() {
  if (!trendChartRef.value) {
    console.warn('图表容器不存在')
    return
  }
  
  try {
    if (!trendChartInstance) {
      console.log('初始化图表实例')
      trendChartInstance = echarts.init(trendChartRef.value)
    }

    if (!trendData.value.length) {
      console.warn('没有趋势数据')
      trendChartInstance.clear()
      return
    }

    // 处理数据，补充缺失的日期
    const processedData = processTrendData(trendData.value)
    
    // 确保数据格式正确
    const xData = processedData.map(item => {
      // 如果日期是时间戳，转换为日期字符串
      if (typeof item.date === 'number') {
        const date = new Date(item.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }
      return item.date
    })
    
    const yData = processedData.map(item => {
      // 使用 dailyHeat 字段
      const heat = parseFloat(item.dailyHeat)
      return isNaN(heat) ? 0 : heat
    })

    console.log('渲染图表数据:', { xData, yData })

    const option = {
      title: { 
        text: '新闻热度趋势',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      tooltip: { 
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params) {
          const date = params[0].axisValue
          const heat = params[0].value
          const data = trendData.value[params[0].dataIndex]
          return `日期：${date}<br/>日热度：${heat.toFixed(2)}<br/>综合热度：${data.comprehensiveHeat.toFixed(2)}<br/>增长率：${(data.growthRate * 100).toFixed(2)}%`
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { 
          rotate: 45,
          interval: 0,
          formatter: function(value) {
            return value
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '热度',
        nameLocation: 'middle',
        nameGap: 40,
        minInterval: 1,
        axisLabel: {
          formatter: function(value) {
            return value.toFixed(2)
          }
        }
      },
      series: [
        {
          data: yData,
          type: 'bar',
          name: '日热度',
          itemStyle: { color: '#409EFF' },
          barWidth: '40%'
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
      ],
      legend: {
        data: ['日热度', '热度曲线'],
        top: 60,
        textStyle: {
          fontSize: 14
        }
      }
    }

    // 清除之前的配置
    trendChartInstance.clear()
    // 设置新的配置
    trendChartInstance.setOption(option, true)
    
    // 强制重新渲染
    trendChartInstance.resize()
  } catch (error) {
    console.error('渲染图表失败:', error)
  }
}

// 添加数据处理函数
function processTrendData(data) {
  if (!data.length) return []

  // 将日期字符串转换为时间戳，用于排序和比较
  const sortedData = data.map(item => ({
    ...item,
    timestamp: typeof item.date === 'number' ? item.date : new Date(item.date).getTime()
  })).sort((a, b) => a.timestamp - b.timestamp)

  const result = []
  const startDate = new Date(sortedData[0].timestamp)
  // 使用查询时间作为结束时间
  const endDate = new Date(trendDate.value)

  // 遍历日期范围，补充缺失的日期
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const currentTimestamp = date.getTime()
    const existingData = sortedData.find(item => {
      const itemDate = new Date(item.timestamp)
      return itemDate.getFullYear() === date.getFullYear() &&
             itemDate.getMonth() === date.getMonth() &&
             itemDate.getDate() === date.getDate()
    })

    if (existingData) {
      result.push(existingData)
    } else {
      // 补充缺失的日期数据
      result.push({
        date: date.toISOString().split('T')[0],
        timestamp: currentTimestamp,
        dailyHeat: 0,
        comprehensiveHeat: 0,
        growthRate: 0
      })
    }
  }

  return result
}

// 监听窗口大小变化
const handleResize = () => {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

// 监听标签页切换
watch(activeName, (val) => {
  if (val === 'second') {
    nextTick(() => {
      if (trendData.value.length) {
        renderTrendChart()
      }
    })
  } else if (trendChartInstance) {
    trendChartInstance.clear()
  }
})

// 监听数据变化
watch(trendData, (newData) => {
  if (newData.length > 0) {
    nextTick(() => {
      renderTrendChart()
    })
  }
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})

// 添加显示新闻内容的方法
const showNewsContent = (news) => {
    selectedNews.value = news
    dialogVisible.value = true
}

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
  padding: 24px;
  margin-bottom: 32px;
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
  margin-bottom: 17px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 3px;
  background: #fafbfc;
}
.news-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  font-size: 1.1em;
  cursor: pointer;
  transition: color 0.3s;
}
.news-title:hover {
  color: #409EFF;
}
.news-details {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 0.9em;
}
.news-details span {
  white-space: nowrap;
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
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  margin-top: 32px;
  display: flex;
  flex-direction: column;
}
.trend-chart {
  width: 100%;
  height: 100%;
  min-height: 600px;
  flex: 1;
}

/* 弹窗样式 */
:deep(.el-dialog) {
  margin-top: 5vh !important;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

:deep(.el-dialog__header) {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid #eee;
}

:deep(.el-dialog__body) {
  padding: 0;
  overflow-y: auto;
  flex: 1;
  max-height: calc(90vh - 60px);
}

.news-detail-container {
  padding: 20px;
  height: 100%;
}

.news-detail-title {
  font-size: 1.8em;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.4;
}

.news-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.meta-group:last-child {
  border-bottom: none;
}

.meta-label {
  font-weight: bold;
  color: #409EFF;
  min-width: 80px;
}

.news-detail-content {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 1.1em;
  color: #333;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

/* 确保弹窗在页面最上层 */
:deep(.el-overlay) {
  z-index: 2000;
}

:deep(.el-dialog__wrapper) {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
</style>