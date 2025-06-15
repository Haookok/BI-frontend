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
  title: { 
    text: '新闻分类每分钟点击趋势',
    top: 10,
    left: 'center'
  },
  tooltip: { trigger: 'axis' },
  legend: { 
    data: [], 
    type: 'scroll',
    top: 40
  },
  grid: {
    top: 80,
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    name: '时间',
    min: 'dataMin',
    max: 'dataMax',
    axisLabel: {
      formatter: value => {
        const date = new Date(value)
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        const hh = String(date.getHours()).padStart(2, '0')
        const min = String(date.getMinutes()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`
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
  
  // 更新时间戳集合
  dataBatch.forEach(d => timeIndexSet.add(d.timestamp))
  let fullTimestamps = fillMissingMinuteTimestamps([...timeIndexSet])

  // 更新每个分类的数据
  for (const category in categorySeriesMap) {
    const series = categorySeriesMap[category]
    const diff = fullTimestamps.length - series.data.length
    if (diff > 0) {
      series.data.push(...Array(diff).fill(0))
    } else if (diff < 0) {
      series.data = series.data.slice(diff)
    }
  }

  // 批量更新数据
  dataBatch.forEach(item => {
    const { timestamp, categories } = item
    const index = fullTimestamps.indexOf(timestamp)
    
    if (index !== -1) {
      Object.entries(categories).forEach(([category, count]) => {
        if (!categorySeriesMap[category]) {
          categorySeriesMap[category] = {
            name: category,
            type: 'line',
            large: true,
            data: fullTimestamps.map(ts => [ts * 1000, 0]),
            showSymbol: false
          }
          option.series.push(categorySeriesMap[category])
          option.legend.data.push(category)
        }
        categorySeriesMap[category].data[index] = [timestamp * 1000, count]
      })
    }
  })

  // 恢复 dataZoom 缩放状态
  if (currentDataZoom && option.dataZoom) {
    for (let i = 0; i < option.dataZoom.length; i++) {
      option.dataZoom[i].start = currentDataZoom[i]?.start ?? option.dataZoom[i].start
      option.dataZoom[i].end = currentDataZoom[i]?.end ?? option.dataZoom[i].end
    }
  }

  // 更新时间轴范围
  if (fullTimestamps.length > 0) {
    option.xAxis.min = fullTimestamps[0] * 1000
    option.xAxis.max = fullTimestamps[fullTimestamps.length - 1] * 1000
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
      if (!data || !Array.isArray(data)) {
        console.warn('数据格式不正确')
        return
      }

      // 使用Map来优化数据处理
      const timestampMap = new Map()
      
      // 按时间戳分组数据
      data.forEach(item => {
        if (item && typeof item === 'object' && 
            typeof item.timestamp === 'number' &&
            typeof item.category === 'string' &&
            typeof item.count === 'number') {
          
          const { timestamp, category, count } = item
          if (!timestampMap.has(timestamp)) {
            timestampMap.set(timestamp, new Map())
          }
          timestampMap.get(timestamp).set(category, count)
        }
      })

      // 将处理后的数据添加到缓冲区
      if (timestampMap.size > 0) {
        bufferedData.push(...Array.from(timestampMap.entries()).map(([timestamp, categoryMap]) => ({
          timestamp,
          categories: Object.fromEntries(categoryMap)
        })))
      }
    } catch (e) {
      console.error('解析数据失败:', e)
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
