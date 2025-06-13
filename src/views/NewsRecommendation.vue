<template>
    <div class="home-layout">
        <Sidebar />
        <div class="main-content">
            <h1 class="mb-6">新闻推荐</h1>
            <div class="news-recommendation-layout">
                <div class="options-panel">
                    <div class="option-input-container">
                        <p>当前新闻ID</p>
                        <el-input v-model="currentNewsId" placeholder="请输入新闻ID" class="option-input"
                        type="number" id="newsId" value="1" />
                    </div>
                    <div class="option-input-container">
                        <p>用户ID</p>
                        <el-input v-model="userId" placeholder="请输入用户ID" class="option-input"
                        type="number" id="userId" value="1001" />
                    </div>
                    <div class="option-input-container">
                        <p>时间选择</p>
                        <el-date-picker v-model="timestamp" type="datetime" placeholder="请选择时间" value-format="x" 
                        style="width: 370px; height: 40px;"/>
                    </div>
                    <el-button type="primary" class="option-btn" @click="sendRequest  ">查询</el-button>
                </div>

                <div class="response-container">
                  <div class="response-header">推荐结果</div>
                  <div v-if="loading">正在发送请求...</div>
                  <div v-else-if="error" class="error">{{ error }}</div>
                  <div v-else>
                    <div v-if="Array.isArray(response) && response.length">
                      <div v-for="news in response" :key="news.id" class="news-item">
                        <div class="news-title">{{ news.headline || '无标题' }}</div>
                        <div class="news-category">分类: {{ news.category || '无分类' }}</div>
                      </div>
                    </div>
                    <div v-else>
                      {{ response ? JSON.stringify(response, null, 2) : '点击"发送请求"按钮查看接口响应结果' }}
                    </div>
                  </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref } from 'vue'

const url = ref('http://localhost:8080/api/recommendations')
const newsId = ref(1)
const userId = ref(1001)
const timestamp = ref(0)

const response = ref(null)
const error = ref('')
const loading = ref(false)

const sendRequest = async () => {
  error.value = ''
  loading.value = true
  response.value = null
  try {
    const res = await fetch(url.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsId: newsId.value,
        userId: userId.value,
        timestamp: Math.floor(timestamp.value / 1000)
      })
    })
    if (!res.ok) throw new Error(`HTTP错误! 状态码: ${res.status}`)
    response.value = await res.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
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

.news-recommendation-layout {
  display: flex;
  height: 95%;
}

.options-panel {
  width: 30%;
  min-width: 220px;
  max-width: 400px;
  height: 39%;
  padding: 32px 16px 32px 16px;
  display: flex;
  gap: 1vw;
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


.response-container {
  margin-top: 20px;
  margin-left: 1vw;
  background-color: #fff;
  border: 1px solid #ddd;
  width: 80%;
  height: 100%;
  min-height: 100px;
  max-height: 46vw;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  padding: 32px 16px 32px 16px;
}
.response-header {
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
}
.news-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 3px;
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
.error {
  color: red;
  font-weight: bold;
  margin-top: 10px;
}
</style>