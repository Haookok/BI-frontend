<template>
  <div class="chart-page">
    <Sidebar />
    <div class="main-content">
      <h1 class="mb-6">新闻分类每分钟点击趋势（大数据优化）</h1>

      <div class="chart-container">
        <div ref="chartRef" style="width: 100%; height: 100%" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import Sidebar from '@/components/Sidebar.vue'

const chartRef = ref(null)
let chart = null
let socket = null
let resizeObserver = null

const MAX_POINTS = 60
const categorySeriesMap = {}
const timeIndexSet = new Set()
let bufferedData = []

function fillMissingMinuteTimestamps(tsList) {
  tsList.sort((a, b) => a - b)
  const filled = []

  for (let i = 0; i < tsList.length - 1; i++) {
    let curr = tsList[i]
    let next = tsList[i + 1]
    filled.push(curr)

    while (next - curr > 60) {
      curr += 60
      timeIndexSet.add(curr)
      filled.push(curr)
    }
  }

  filled.push(tsList[tsList.length - 1])
  return Array.from(new Set(filled)).sort((a, b) => a - b)
}

let option = {
  title: { text: '新闻分类每分钟点击趋势' },
  tooltip: { trigger: 'axis' },
  legend: { data: [], type: 'scroll' },
  xAxis: {
    type: 'category',
    data: [],
    name: '时间（分钟）',
    axisLabel: {
      formatter(value) {
        const date = new Date(value * 1000)
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      }
    }
  },
  yAxis: { type: 'value', name: '点击次数' },
  dataZoom: [
    { type: 'slider', show: true, xAxisIndex: 0, start: 0, end: 100 },
    { type: 'inside', xAxisIndex: 0, start: 0, end: 100 }
  ],
  series: [],
  animation: false
}

function updateChart() {
  if (bufferedData.length === 0) return

  // 保存用户当前的 dataZoom 状态
  const currentDataZoom = chart.getOption().dataZoom?.map(z => ({
    start: z.start,
    end: z.end
  }))

  const dataBatch = bufferedData.splice(0, bufferedData.length)
  const incomingTimestamps = dataBatch.map(d => d.timestamp)
  incomingTimestamps.forEach(ts => timeIndexSet.add(ts))

  let fullTimestamps = fillMissingMinuteTimestamps([...timeIndexSet])
  option.xAxis.data = fullTimestamps

  for (const category in categorySeriesMap) {
    const series = categorySeriesMap[category]
    const diff = fullTimestamps.length - series.data.length
    if (diff > 0) {
      series.data.push(...Array(diff).fill(0))
    } else if (diff < 0) {
      series.data = series.data.slice(diff)
    }
  }

  dataBatch.forEach(item => {
    const ts = item.timestamp
    const category = item.category || '未知'
    const count = item.count || 0

    if (!categorySeriesMap[category]) {
      categorySeriesMap[category] = {
        name: category,
        type: 'line',
        large: true,
        data: Array(fullTimestamps.length).fill(0),
        showSymbol: false
      }
      option.series.push(categorySeriesMap[category])
      option.legend.data.push(category)
    }

    const index = fullTimestamps.indexOf(ts)
    if (index !== -1) {
      categorySeriesMap[category].data[index] = count
    }
  })

  // 恢复 dataZoom 缩放状态
  if (currentDataZoom && option.dataZoom) {
    for (let i = 0; i < option.dataZoom.length; i++) {
      option.dataZoom[i].start = currentDataZoom[i]?.start ?? option.dataZoom[i].start
      option.dataZoom[i].end = currentDataZoom[i]?.end ?? option.dataZoom[i].end
    }
  }

  chart.setOption(option, { notMerge: false })
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  chart.setOption(option)

  resizeObserver = new ResizeObserver(() => {
    chart.resize()
  })
  resizeObserver.observe(chartRef.value)

  socket = new WebSocket('ws://localhost:8080/ws/minute-category-stats')

  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data)
      if (Array.isArray(data)) {
        bufferedData.push(...data)
      }
    } catch (e) {
      console.error('解析数据失败', e)
    }
  }

  socket.onopen = () => console.log('✅ WebSocket 已连接')
  socket.onerror = e => console.error('❌ WebSocket 出错', e)
  socket.onclose = () => console.log('🔌 WebSocket 已关闭')

  setInterval(updateChart, 1000)
})

onUnmounted(() => {
  if (chart) chart.dispose()
  if (socket) socket.close()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.chart-page {
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

.chart-container {
  width: 100%;
  height: calc(100vh - 160px);
  min-height: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  padding: 16px 24px;
}
</style>
