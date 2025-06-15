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
                        type="number" id="newsId" />
                    </div>
                    <div class="option-input-container">
                        <p>用户ID</p>
                        <el-input v-model="userId" placeholder="请输入用户ID" class="option-input"
                        type="number" id="userId" />
                    </div>
                    <div class="option-input-container">
                        <p>时间选择</p>
                        <el-date-picker v-model="timestamp" type="datetime" placeholder="请选择时间" value-format="x" 
                        style="width: 100%; height: 40px;"/>
                    </div>
                    <el-button type="primary" class="option-btn" @click="sendRequest">查询</el-button>
                </div>

                <div class="response-container">
                  <div class="response-header">推荐结果</div>
                  <div v-if="loading">正在发送请求...</div>
                  <div v-else-if="error" class="error">{{ error }}</div>
                  <div v-else>
                    <div v-if="Array.isArray(response) && response.length">
                      <div v-for="news in response" :key="news.newsId" class="news-item">
                        <div class="news-title" @click="showNewsContent(news)">{{ news.headline || '无标题' }}</div>
                        <div class="news-details">
                          <span class="news-category">分类: {{ news.category || '无分类' }}</span>
                          <span class="news-topic">主题: {{ news.topic || '-' }}</span>
                          <span class="news-id">ID: {{ news.newsId }}</span>
                          <span class="news-browse">浏览次数: {{ news.totalBrowseNum }}</span>
                          <span class="news-duration">浏览时长: {{ news.totalBrowseDuration }}s</span>
                        </div>
                      </div>
                    </div>
                    <div v-else>
                      {{ response ? JSON.stringify(response, null, 2) : '点击"发送请求"按钮查看接口响应结果' }}
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
                        <span>总浏览量: {{ selectedNews?.totalBrowseNum || 0 }}</span>
                        <span>总浏览时长: {{ selectedNews?.totalBrowseDuration || 0 }}s</span>
                      </div>
                    </div>
                    <div class="news-detail-content">
                      {{ selectedNews?.content || '暂无内容' }}
                    </div>
                  </div>
                </el-dialog>
            </div>
        </div>
    </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref } from 'vue'

const url = ref('http://localhost:8080/api/recommendations')
const currentNewsId = ref('')
const userId = ref('')
const timestamp = ref(0)

const response = ref(null)
const error = ref('')
const loading = ref(false)

// 添加弹窗相关的状态
const dialogVisible = ref(false)
const selectedNews = ref(null)

// 添加显示新闻内容的方法
const showNewsContent = (news) => {
  selectedNews.value = news
  dialogVisible.value = true
}

const sendRequest = async () => {
  error.value = ''
  loading.value = true
  response.value = null
  try {
    const res = await fetch(url.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsId: parseInt(currentNewsId.value),
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
.news-category {
  color: #666;
  font-size: 0.9em;
}
.error {
  color: red;
  font-weight: bold;
  margin-top: 10px;
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