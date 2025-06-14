<template>
    <div class="home-layout">
        <Sidebar />
        <div class="main-content">
            <h1 class="mb-6">新闻生命周期</h1>
            <div class="news-lifecycle-layout">
                <div class="options-panel">
                    <div class="option-input-container">
                        <p>新闻ID</p>
                        <el-input v-model="newsId" placeholder="请输入新闻ID" style="width: 200px; height: 40px; margin-left: 16px; margin-right: 16px; " />
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const newsId = ref('')
const chartRef = ref(null)
let chart = null
let socket = null
const seenTimestamps = new Set()
const MAX_POINTS = 10000000000 // 数据点数量无上限
let resizeObserver = null

// 初始化图表
const initChart = async () => {
    try {
        if (!chartRef.value) {
            console.warn('图表容器未找到')
            return
        }

        // 如果已经存在图表实例，先销毁
        if (chart) {
            chart.dispose()
            chart = null
        }

        // 创建新的图表实例
        chart = echarts.init(chartRef.value)
        
        const option = {
            title: { text: '每秒浏览量变化' },
            tooltip: { trigger: 'axis' },
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

        // 设置ResizeObserver
        if (resizeObserver) {
            resizeObserver.disconnect()
        }

        resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === chartRef.value) {
                    if (chart) {
                        chart.resize()
                    }
                }
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

        // 建立WebSocket连接
        socket = new WebSocket('ws://localhost:8080/ws/data')
        console.log('正在连接WebSocket...')

        socket.onmessage = function(event) {
            console.log("收到WebSocket消息：", event.data)

            let data
            try {
                data = JSON.parse(event.data)
            } catch (e) {
                console.error("JSON解析失败：", e)
                return
            }

            if (!Array.isArray(data)) {
                console.warn("收到的数据不是数组：", data)
                return
            }

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
                chart.resize()
            })
        }

        socket.onopen = () => {
            console.log("✅ WebSocket已连接")
            // 👉 在连接建立后，发送用户输入的 newsId 给后端
            socket.send(newsId.value.toString())
            ElMessage.success('开始监控')
        }


        socket.onerror = (e) => {
            console.error("❌ WebSocket出错", e)
            ElMessage.error('连接出错')
        }

        socket.onclose = () => {
            console.log("🔌 WebSocket已关闭")
            ElMessage.info('监控已停止')
        }
    } catch (error) {
        console.error('启动监控失败:', error)
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

// 处理窗口大小变化
const handleResize = () => {
    if (chart) {
        chart.resize()
    }
}

onMounted(() => {
    // 直接初始化图表
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

.lifecycle-chart-container {
    width: 100%;
    height: calc(100vh - 200px);
    min-height: 400px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
    position: relative;
    overflow: hidden;
}
</style>