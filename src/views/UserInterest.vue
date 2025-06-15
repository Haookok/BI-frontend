<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <h1 class="mb-6">用户新闻分类浏览趋势</h1>

      <div class="options-panel">
        <div class="option-input-container">
          <p>用户ID</p>
          <el-input
            v-model="userId"
            placeholder="请输入用户ID"
            style="width: 200px; height: 40px; margin-left: 16px; margin-right: 16px;"
          />
        </div>
        <el-button type="primary" class="option-btn" @click="startMonitoring">开始监控</el-button>
        <el-button type="danger" class="option-btn" @click="stopMonitoring">停止监控</el-button>
      </div>

      <div class="chart-container">
        <div ref="chartRef" style="width: 100%; height: 100%" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const chartRef = ref(null)
let chart = null
let socket = null
let resizeObserver = null

const userId = ref('')
const categorySeriesMap = {} // category -> series object
const timeIndexSet = new Set()
let option = null

function fillMissingTimestamps(tsList) {
  tsList.sort((a, b) => a - b)
  const filled = []

  for (let i = 0; i < tsList.length - 1; i++) {
    let curr = tsList[i]
    let next = tsList[i + 1]
    filled.push(curr)

    while (next - curr > 3600) {
      curr += 3600
      timeIndexSet.add(curr)
      filled.push(curr)
    }
  }

  filled.push(tsList[tsList.length - 1])
  return Array.from(new Set(filled)).sort((a, b) => a - b)
}

function initChart() {
  chart = echarts.init(chartRef.value)

  option = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    legend: { data: [], type: 'scroll' },
    xAxis: {
      type: 'time',
      name: '时间',
      axisLabel: {
        formatter: value => {
          const date = new Date(value)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hour = String(date.getHours()).padStart(2, '0')
          return `${year}-${month}-${day} ${hour}:00`
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '浏览次数'
    },
    dataZoom: [
      { type: 'slider', show: true, xAxisIndex: 0, start: 0, end: 100 },
      { type: 'inside', xAxisIndex: 0, start: 0, end: 100 }
    ],
    series: []
  }

  chart.setOption(option, { notMerge: false })

  resizeObserver = new ResizeObserver(() => {
    chart.resize()
  })
  resizeObserver.observe(chartRef.value)
}

function startMonitoring() {
  if (!userId.value) {
    ElMessage.warning('请输入用户ID')
    return
  }

  if (chart) {
    chart.setOption({ series: [] })
  }

  for (const key in categorySeriesMap) {
    delete categorySeriesMap[key]
  }

  timeIndexSet.clear()

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close()
  }

  socket = new WebSocket('ws://localhost:8080/ws/category')

  socket.onopen = () => {
    console.log('✅ WebSocket 已连接')
    socket.send(userId.value.toString())
    ElMessage.success('开始监控')
  }

  socket.onerror = e => {
    console.error('❌ WebSocket 出错', e)
    ElMessage.error('WebSocket 出错')
  }

  socket.onclose = () => {
    console.log('🔌 WebSocket 已关闭')
    ElMessage.info('监控已停止')
  }

  socket.onmessage = event => {
    let data
    try {
      data = JSON.parse(event.data)
    } catch (e) {
      console.error('数据解析失败', e)
      return
    }

    const incomingTimestamps = data.map(d => d.timestamp)
    incomingTimestamps.forEach(ts => timeIndexSet.add(ts))
    const fullTimestamps = fillMissingTimestamps([...timeIndexSet])

    for (const category in categorySeriesMap) {
      const series = categorySeriesMap[category]
      const diff = fullTimestamps.length - series.data.length
      if (diff > 0) {
        series.data.push(...Array(diff).fill(0))
      } else if (diff < 0) {
        series.data.length = fullTimestamps.length
      }
    }

    data.forEach(({ timestamp, category = '未知', count = 0 }) => {
      if (!categorySeriesMap[category]) {
        categorySeriesMap[category] = {
          name: category,
          type: 'bar',
          data: fullTimestamps.map(ts => [ts * 1000, 0]), // 转换为毫秒时间戳
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2 }
        }
      }

      const index = fullTimestamps.indexOf(timestamp)
      if (index !== -1) {
        categorySeriesMap[category].data[index] = [timestamp * 1000, count] // 转换为毫秒时间戳
      }
    })

    chart.setOption({
      series: Object.values(categorySeriesMap),
      legend: {
        data: Object.keys(categorySeriesMap)
      }
    }, { notMerge: false })
  }
}

function stopMonitoring() {
  if (socket) {
    socket.close()
    socket = null
    ElMessage.info('监控已停止')
  }
}

onMounted(() => {
  if (!chartRef.value) {
    ElMessage.error('图表容器未挂载')
    return
  }

  initChart()
  window.addEventListener('resize', () => chart && chart.resize())
})

onUnmounted(() => {
  if (chart) chart.dispose()
  if (socket) socket.close()
  if (resizeObserver) resizeObserver.disconnect()
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

.options-panel {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.03);
  padding: 16px 24px;
  margin-bottom: 24px;
}

.option-input-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.option-input-container p {
  font-size: 16px;
  margin: 0 8px 0 0;
  white-space: nowrap;
}

.option-btn {
  min-width: 120px;
  height: 40px;
}

.chart-container {
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  padding: 16px 24px;
}
</style>
