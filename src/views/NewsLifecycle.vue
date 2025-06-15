<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <h1 class="mb-6">新闻生命周期</h1>
      <div class="news-lifecycle-layout">
        <div class="options-panel">
          <div class="option-input-container">
            <p>新闻ID</p>
            <el-input v-model="newsId" placeholder="请输入新闻ID" style="width: 200px; height: 40px; margin-left: 16px; margin-right: 16px;" />
          </div>
          <el-button type="primary" class="option-btn" @click="startMonitoring">开始监控</el-button>
          <el-button type="danger" class="option-btn" @click="stopMonitoring">停止监控</el-button>
        </div>
        <div class="lifecycle-chart-container">
          <div ref="chartRef" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const newsId = ref('')
const chartRef = ref(null)
let chart = null
let socket = null
const seenTimestamps = new Set()
const MAX_POINTS = 10000000000
let resizeObserver = null

// 初始化图表
const initChart = async () => {
  try {
    if (!chartRef.value) {
      console.warn('⚠️ 图表容器未挂载 chartRef.value =', chartRef.value)
      ElMessage.error('图表容器未加载，请刷新页面')
      return
    }

    if (chart) {
      chart.dispose()
      chart = null
    }

    chart = echarts.init(chartRef.value)

    const option = {
      title: { text: '每秒浏览量变化' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'time',
        name: '时间',
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
      yAxis: {
        type: 'value',
        name: '浏览次数'
      },
      series: [{
        name: '每秒浏览量',
        type: 'line',
        data: [],
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2 }
      }],
      dataZoom: [
        { type: 'slider', show: true, xAxisIndex: 0, start: 0, end: 100 },
        { type: 'inside', xAxisIndex: 0, start: 0, end: 100 }
      ]
    }

    chart.setOption(option)
    console.log('✅ 图表初始化成功')

    if (resizeObserver) resizeObserver.disconnect()

    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === chartRef.value && chart) chart.resize()
      }
    })

    resizeObserver.observe(chartRef.value)
  } catch (error) {
    console.error('图表初始化失败:', error)
    ElMessage.error('图表初始化失败')
  }
}

// 开始监控
const startMonitoring = async () => {
  if (!newsId.value) {
    ElMessage.warning('请输入新闻ID')
    return
  }

  try {
    if (!chart) {
      ElMessage.warning('图表尚未初始化')
      return
    }

    chart.setOption({ series: [{ data: [] }] })
    seenTimestamps.clear()

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close()
    }

    socket = new WebSocket('ws://localhost:8080/ws/data')
    console.log('🟡 正在连接 WebSocket...')

    socket.onopen = () => {
      console.log('✅ WebSocket 已连接')
      socket.send(newsId.value.toString())
      ElMessage.success('开始监控')
    }

    socket.onerror = e => {
      console.error('❌ WebSocket 出错', e)
      ElMessage.error('连接出错')
    }

    socket.onclose = () => {
      console.log('🔌 WebSocket 已关闭')
      ElMessage.info('监控已停止')
    }

    socket.onmessage = event => {
      console.log('📨 收到消息：', event.data)

      if (!chart) return

      let data
      try {
        data = JSON.parse(event.data)
      } catch (e) {
        console.error('JSON 解析失败：', e)
        return
      }

      if (!Array.isArray(data)) {
        console.warn('收到的数据不是数组：', data)
        return
      }

      data.sort((a, b) => a.timestamp - b.timestamp)

      const seriesData = chart.getOption().series[0].data
      let lastTime = null
      if (seriesData.length > 0) {
        lastTime = seriesData[seriesData.length - 1][0]
      }

      data.forEach(d => {
        if (typeof d.timestamp !== 'number' || typeof d.count !== 'number') return

        const currentTime = d.timestamp * 1000 // 秒转毫秒

        // ✅ 补0逻辑（分钟为单位）
        if (lastTime !== null) {
          let t = lastTime + 60000
          while (t < currentTime) {
            if (!seenTimestamps.has(t)) {
              seenTimestamps.add(t)
              chart.appendData({
                seriesIndex: 0,
                data: [[t, 0]]
              })
              console.log(`补 0 -> 时间戳: ${t}`)
            }
            t += 60000
          }
        }

        // ✅ 添加当前数据
        if (!seenTimestamps.has(currentTime)) {
          seenTimestamps.add(currentTime)
          chart.appendData({
            seriesIndex: 0,
            data: [[currentTime, d.count]]
          })
          console.log(`添加数据点 -> 时间戳: ${currentTime}, 浏览量: ${d.count}`)
          lastTime = currentTime
        }

        chart.resize()
      })
    }
  } catch (err) {
    console.error('启动监控失败:', err)
    ElMessage.error('启动监控失败')
  }
}

// 停止监控
const stopMonitoring = () => {
  if (socket) {
    socket.close()
    socket = null
  }
}

// 页面挂载/卸载逻辑
onMounted(() => {
  console.log('📦 chartRef 是否挂载：', chartRef.value)
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopMonitoring()
  if (chart) {
    chart.dispose()
    chart = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (chart) chart.resize()
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
  margin-right: 16px;
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

.lifecycle-chart-container {
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 400px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
}
</style>
