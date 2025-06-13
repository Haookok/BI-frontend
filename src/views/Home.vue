<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <h1>欢迎来到首页</h1>
      <el-date-picker v-model="date" type="datetime" />
      <div class="echarts-box">
        <div id="myEcharts" :style="{ width: '900px', height: '300px' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts';

let chartInstance = null;

function resizeChart() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

function initEcharts() {
  chartInstance = echarts.init(document.getElementById('myEcharts'));
  chartInstance.setOption({
    title: {
      text: 'ECharts 入门示例'
    },
    xAxis: {
      data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
    },
    tooltip: {
      trigger: "axis"
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320, 801, 102, 230, 4321, 4129],
        type: "line",
        smooth: true
      }
    ]
  });
  window.addEventListener('resize', resizeChart);
}

onMounted(() => {
  initEcharts();
});
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', resizeChart);
});

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
.main-content h1 {
  color: #000;
}
</style>
