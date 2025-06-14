<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <h1 class="mb-6">新闻生命周期</h1>
      <div class="news-lifecycle-layout">
        <!-- 左侧选项区 -->
        <div class="options-panel">
          <div class="option-input-container">
            <p>新闻ID</p>
            <el-input v-model="newsId" placeholder="请输入新闻ID" class="option-input" />
          </div>
          <el-button type="primary" class="option-btn" @click="startMonitoring" :disabled="isMonitoring">开始监控</el-button>
          <el-button type="danger" class="option-btn" @click="stopMonitoring" :disabled="!isMonitoring">停止监控</el-button>
        </div>
        <!-- 右侧图表区 -->
        <div class="chart-panel">
          <el-card class="chart-card">
            <h4>新闻实时浏览量变化</h4>
            <div ref="chartRef" class="chart-container"></div>
          </el-card>
        </div>
      </div>    
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import Sidebar from '@/components/Sidebar.vue'

// 常量定义
const MAX_POINTS = 120 // 最多保留120个数据点
const MAX_RETRY_COUNT = 5 // 最大重试次数
const RETRY_INTERVAL = 3000 // 重试间隔（毫秒）

// 响应式状态
const newsId = ref('')
const chartRef = ref(null)
const isMonitoring = ref(false)

// 非响应式状态
let chart = null
let socket = null
let retryCount = 0
let retryTimer = null
const seenTimestamps = new Set()

// 初始化图表
const initChart = async () => {
  try {
    await nextTick()
    if (!chartRef.value) {
      console.warn('图表容器未找到')
      return
    }
    
    if (chart) {
      chart.dispose()
    }
    
    chart = echarts.init(chartRef.value)
    
    const option = {
      title: { text: '每秒浏览量变化' },
      tooltip: { trigger: 'axis' },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [],
        name: '时间',
        axisLabel: {
          formatter: function (value) {
            const date = new Date(value * 1000)
            return date.toLocaleTimeString()
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
        lineStyle: {
          width: 2
        }
      }]
    }
    
    chart.setOption(option)
    console.log('图表初始化成功')
  } catch (error) {
    console.error('图表初始化失败:', error)
    ElMessage.error('图表初始化失败')
  }
}

// 处理WebSocket消息
const handleWebSocketMessage = (event) => {
  try {
    const data = JSON.parse(event.data)
    if (!Array.isArray(data)) {
      console.warn("收到的数据不是数组：", data)
      return
    }
    
    // 重置重试计数
    retryCount = 0
    
    // 按timestamp升序排序
    data.sort((a, b) => a.timestamp - b.timestamp)
    
    data.forEach((d) => {
      if (typeof d.timestamp !== "number" || typeof d.count !== "number") {
        console.warn("数据格式错误：", d)
        return
      }
      
      const currentTime = d.timestamp
      
      // 获取前一个时间
      let lastTime = null
      if (chart.getOption().xAxis[0].data.length > 0) {
        lastTime = chart.getOption().xAxis[0].data[chart.getOption().xAxis[0].data.length - 1]
      }
      
      // 检查是否有遗漏的整分钟
      if (lastTime !== null) {
        let t = lastTime + 60
        while (t < currentTime) {
          if (!seenTimestamps.has(t)) {
            seenTimestamps.add(t)
            chart.appendData({
              seriesIndex: 0,
              data: [[t, 0]]
            })
          }
          t += 60
        }
      }
      
      if (!seenTimestamps.has(currentTime)) {
        seenTimestamps.add(currentTime)
        chart.appendData({
          seriesIndex: 0,
          data: [[currentTime, d.count]]
        })
      }
      
      // 限制数据点数量
      const currentData = chart.getOption().xAxis[0].data
      if (currentData.length > MAX_POINTS) {
        const removeCount = currentData.length - MAX_POINTS
        chart.setOption({
          xAxis: {
            data: currentData.slice(removeCount)
          },
          series: [{
            data: chart.getOption().series[0].data.slice(removeCount)
          }]
        })
      }
    })
  } catch (error) {
    console.error('处理WebSocket消息失败:', error)
  }
}

// 建立WebSocket连接
const createWebSocket = () => {
  try {
    // 关闭已存在的连接
    if (socket) {
      socket.close()
      socket = null
    }

    // 构建WebSocket URL
    const wsUrl = 'ws://localhost:8080/ws/data'
    console.log('正在连接WebSocket:', wsUrl)

    // 建立新的WebSocket连接
    socket = new WebSocket(wsUrl)
    
    // 设置连接超时
    const connectionTimeout = setTimeout(() => {
      if (socket && socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket连接超时，当前状态:', socket.readyState)
        socket.close()
        handleConnectionError()
      }
    }, 5000) // 5秒超时

    // 添加readyState变化监听
    const checkConnection = setInterval(() => {
      if (socket) {
        console.log('WebSocket状态:', {
          CONNECTING: WebSocket.CONNECTING,
          OPEN: WebSocket.OPEN,
          CLOSING: WebSocket.CLOSING,
          CLOSED: WebSocket.CLOSED,
          currentState: socket.readyState
        })
      }
    }, 1000)
    
    socket.onmessage = (event) => {
      console.log("收到 WebSocket 消息：", event.data)
      
      try {
        const data = JSON.parse(event.data)
        if (!Array.isArray(data)) {
          console.warn("收到的数据不是数组：", data)
          return
        }
        
        // 重置重试计数
        retryCount = 0
        
        // 按timestamp升序排序
        data.sort((a, b) => a.timestamp - b.timestamp)
        
        data.forEach((d) => {
          if (typeof d.timestamp !== "number" || typeof d.count !== "number") {
            console.warn("数据格式错误：", d)
            return
          }
          
          const currentTime = d.timestamp
          
          // 获取前一个时间
          let lastTime = null
          if (chart.getOption().xAxis[0].data.length > 0) {
            lastTime = chart.getOption().xAxis[0].data[chart.getOption().xAxis[0].data.length - 1]
          }
          
          // 检查是否有遗漏的整分钟
          if (lastTime !== null) {
            let t = lastTime + 60
            while (t < currentTime) {
              if (!seenTimestamps.has(t)) {
                seenTimestamps.add(t)
                chart.appendData({
                  seriesIndex: 0,
                  data: [[t, 0]]
                })
                console.log(`补充缺失整分钟 -> 时间戳: ${t}, 浏览量: 0`)
              }
              t += 60
            }
          }
          
          if (!seenTimestamps.has(currentTime)) {
            seenTimestamps.add(currentTime)
            chart.appendData({
              seriesIndex: 0,
              data: [[currentTime, d.count]]
            })
            console.log(`添加数据点 -> 时间戳: ${currentTime}, 浏览量: ${d.count}`)
          }
          
          // 限制数据点数量
          const currentData = chart.getOption().xAxis[0].data
          if (currentData.length > MAX_POINTS) {
            const removeCount = currentData.length - MAX_POINTS
            const removedData = currentData.slice(0, removeCount)
            removedData.forEach(time => seenTimestamps.delete(time))
            
            chart.setOption({
              xAxis: {
                data: currentData.slice(removeCount)
              },
              series: [{
                data: chart.getOption().series[0].data.slice(removeCount)
              }]
            })
          }
        })
      } catch (error) {
        console.error('处理WebSocket消息失败:', error)
      }
    }
    
    socket.onopen = () => {
      console.log("✅ WebSocket已连接")
      clearTimeout(connectionTimeout)
      clearInterval(checkConnection)
      isMonitoring.value = true
      ElMessage.success('开始监控')
      // 连接成功后清除重试定时器
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      retryCount = 0
    }
    
    socket.onerror = (e) => {
      console.error("❌ WebSocket出错", {
        error: e,
        readyState: socket.readyState,
        url: socket.url
      })
      clearTimeout(connectionTimeout)
      clearInterval(checkConnection)
      handleConnectionError()
    }
    
    socket.onclose = (event) => {
      console.log("🔌 WebSocket已关闭", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        readyState: socket.readyState
      })
      clearTimeout(connectionTimeout)
      clearInterval(checkConnection)
      handleConnectionError()
    }
  } catch (error) {
    console.error('WebSocket连接失败:', error)
    handleConnectionError()
  }
}

// 处理连接错误
const handleConnectionError = () => {
  isMonitoring.value = false
  ElMessage.error('连接断开')
  
  // 如果还在监控状态，尝试重连
  if (isMonitoring.value && retryCount < MAX_RETRY_COUNT) {
    retryCount++
    console.log(`尝试重连 (${retryCount}/${MAX_RETRY_COUNT})...`)
    ElMessage.warning(`连接断开，${RETRY_INTERVAL/1000}秒后尝试重连 (${retryCount}/${MAX_RETRY_COUNT})`)
    
    if (retryTimer) {
      clearTimeout(retryTimer)
    }
    
    retryTimer = setTimeout(() => {
      createWebSocket()
    }, RETRY_INTERVAL)
  } else if (retryCount >= MAX_RETRY_COUNT) {
    ElMessage.error('重连次数已达上限，请手动重试')
    isMonitoring.value = false
  }
}

// 开始监控
const startMonitoring = async () => {
  if (isMonitoring.value) {
    ElMessage.warning('已经在监控中')
    return
  }
  
  try {
    // 确保图表已初始化
    if (!chart) {
      await initChart()
    }
    
    // 重置状态
    retryCount = 0
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    
    createWebSocket()
  } catch (error) {
    console.error('启动监控失败:', error)
    ElMessage.error('启动监控失败')
  }
}

// 停止监控
const stopMonitoring = () => {
  if (socket) {
    try {
      socket.close(1000, '用户手动停止')
    } catch (error) {
      console.error('关闭WebSocket连接失败:', error)
    }
    socket = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  isMonitoring.value = false
  retryCount = 0
}

// 处理窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

// 监听新闻ID变化
watch(newsId, () => {
  if (isMonitoring.value) {
    stopMonitoring()
  }
})

// 生命周期钩子
onMounted(async () => {
  await initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopMonitoring()
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
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

.chart-container {
  width: 100%;
  height: calc(100% - 40px);
  min-height: 400px;
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
  height: 20%;
  padding: 32px 16px 32px 16px;
  display: flex;
  gap: 1.5vw;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  margin-top: 15%;
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
</style> 