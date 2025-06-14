<template>
    <div class="home-layout">
        <Sidebar />
        <div class="main-content">
          <h1 class="mb-6">综合查询</h1>
          <div class="complex-query-layout">
            <div class="options-panel">
              <div class="option-input-container">
                <p>起始时间</p>
                <el-date-picker v-model="startDate" type="datetime" placeholder="请选择起始时间" value-format="x" 
                style="width: 100%; height: 40px;"/>
              </div>
              <div class="option-input-container">
                <p>结束时间</p>
                <el-date-picker v-model="endDate" type="datetime" placeholder="请选择结束时间" value-format="x" 
                style="width: 100%; height: 40px;"/>
              </div>
              <div class="option-input-container">
                <p>新闻主题</p>
                <el-input v-model="newsTitle" placeholder="请输入新闻主题" class="option-input" type="text" id="newsTitle" />
              </div>
              <div class="option-input-container">
                <p>用户ID</p>
                <div v-for="(id, idx) in userIds" :key="idx" style="display: flex; align-items: center; margin-bottom: 8px;">
                  <el-input
                    v-model="userIds[idx]"
                    placeholder="请输入用户ID"
                    class="option-input"
                    type="number"
                  />
                  <el-button
                    v-if="userIds.length > 1"
                    type="danger"
                    :icon="Minus"
                    @click="removeUserId(idx)"
                    style="margin-left: 8px;"
                    circle
                  />
                </div>
                <el-button type="primary" :icon="Plus" @click="addUserId" style="margin-top: 4px;" round>添加用户</el-button>
              </div>
              
              <div class="option-input-container">
                <p>最小标题长度</p>
                <el-input v-model="minTitleLength" placeholder="请输入最小标题长度" class="option-input" type="number" id="minTitleLength" />
              </div>
              <div class="option-input-container">
                <p>最大标题长度</p>
                <el-input v-model="maxTitleLength" placeholder="请输入最大标题长度" class="option-input" type="number" id="maxTitleLength" />
              </div>
              <div class="option-input-container">
                <p>最小内容长度</p>
                <el-input v-model="minContentLength" placeholder="请输入最小内容长度" class="option-input" type="number" id="minContentLength" />
              </div>
              <div class="option-input-container">
                <p>最大内容长度</p>
                <el-input v-model="maxContentLength" placeholder="请输入最大内容长度" class="option-input" type="number" id="maxContentLength" />
              </div>
              <el-button type="primary" class="option-btn" @click="fetchData">查询</el-button>
            </div>

            
            <div class="response-container">
                  <div class="response-header">
                    <span>查询结果</span>
                    <el-button circle size="small" @click="prevPage" :disabled="pageNumber === 1">
                      <el-icon><ArrowLeft /></el-icon>
                    </el-button>
                    <span style="margin: 0 8px;">{{ pageNumber }} / {{ totalPages }}</span>
                    <el-button circle size="small" @click="nextPage" :disabled="pageNumber === totalPages">
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                    <span style="margin: 0 8px;">浏览总数：{{ response?.browseCount || 0 }}</span>
                  </div>
                  <div v-if="loading">正在发送请求...</div>
                  <div v-else-if="error" class="error">{{ error }}</div>
                  <div v-else>
                    <div v-if="response && response.newsList && response.newsList.length">
                      <div v-for="news in response.newsList" :key="news.newsId" class="news-item">
                        <div class="news-title" @click="showNewsContent(news)">{{ news.headline || '无标题' }}</div>
                        <div class="news-details">
                          <span class="news-category">分类: {{ news.category || '无分类' }}</span>
                          <span class="news-topic">主题: {{ news.topic || '-' }}</span>
                          <span class="news-id">ID: {{ news.newsId }}</span>
                          <span class="news-content-length">内容长度: {{ news.content ? news.content.length : 0 }}</span>
                          <span class="news-content-length">浏览次数: {{ news.totalBrowseNum }}</span>
                          <span class="news-content-length">浏览时长: {{ news.totalBrowseDuration }}s</span>
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
              :title="新闻详情"
              width="80%"
              class="news-dialog"
            >
              <div class="news-detail-container">
                <h2 class="news-detail-title">{{ selectedNews?.headline || '无标题' }}</h2>
                <div class="news-detail-meta">
                  <span>分类: {{ selectedNews?.category || '无分类' }}</span>
                  <span>主题: {{ selectedNews?.topic || '-' }}</span>
                  <span>ID: {{ selectedNews?.newsId }}</span>
                  <span>浏览次数: {{ selectedNews?.totalBrowseNum || 0 }}</span>
                  <span>浏览时长: {{ selectedNews?.totalBrowseDuration || 0 }}s</span>
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
import { Minus, Plus, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const userIds = ref(['']) // 初始只有一个输入框
const pageNumber = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const response = ref(null)
const error = ref('')
const loading = ref(false)

const startDate = ref('')
const endDate = ref('')
const newsTitle = ref('')
const minTitleLength = ref('')
const maxTitleLength = ref('')
const minContentLength = ref('')
const maxContentLength = ref('')

// 添加一个用户ID输入框
const addUserId = () => {
  userIds.value.push('')
}

// 删除某个输入框
const removeUserId = (index) => {
  if (userIds.value.length > 1) {
    userIds.value.splice(index, 1)
  }
}

const prevPage = () => {
  if (pageNumber.value > 1) {
    pageNumber.value--
    fetchData()
  }
}
const nextPage = () => {
  if (pageNumber.value < totalPages.value) {
    pageNumber.value++
    fetchData()
  }
}

const fetchData = async () => {
  error.value = ''
  loading.value = true
  response.value = null
  // 处理用户ID
  const ids = userIds.value.map(id => id && id.toString().trim()).filter(id => id !== '')
  let userId = null
  let userIdList = null
  if (ids.length === 1) {
    userId = parseInt(ids[0])
  } else if (ids.length > 1) {
    userIdList = ids.map(id => parseInt(id))
  }
  const dto = {
    startTime: startDate.value ? Math.floor(parseInt(startDate.value) / 1000) : null,
    endTime: endDate.value ? Math.floor(parseInt(endDate.value) / 1000) : null,
    topic: newsTitle.value || null,
    userId: userId ? parseInt(userId) : null,
    userIdList: userIdList ? userIdList.map(id => parseInt(id)) : null,
    minTitleLength: minTitleLength.value ? parseInt(minTitleLength.value) : null,
    maxTitleLength: maxTitleLength.value ? parseInt(maxTitleLength.value) : null,
    minContentLength: minContentLength.value ? parseInt(minContentLength.value) : null,
    maxContentLength: maxContentLength.value ? parseInt(maxContentLength.value) : null,
    page: pageNumber.value ? parseInt(pageNumber.value) : 1,
    size: pageSize.value ? parseInt(pageSize.value) : 10
  }
  
  // 打印请求体内容
  console.log('请求体内容:', JSON.stringify(dto, null, 2))
  
  try {
    const res = await fetch('http://localhost:8080/api/news/statistics/browse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    const data = await res.json()
    response.value = data
    // 计算总页数
    if (data && data.total && data.size) {
      totalPages.value = Math.ceil(data.total / data.size)
    } else if (data && data.page && data.size && data.newsList) {
      // 兼容后端只返回当前页和每页数量
      totalPages.value = data.newsList.length < data.size ? data.page : data.page + 1
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// 添加弹窗相关的状态
const dialogVisible = ref(false)
const selectedNews = ref(null)

// 添加显示新闻内容的方法
const showNewsContent = (news) => {
  selectedNews.value = news
  dialogVisible.value = true
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

.complex-query-layout {
  display: flex;
  height: 95%;
}

.options-panel {
  width: 30%;
  min-width: 220px;
  max-width: 400px;
  height: 100%;
  min-height: 100px;
  max-height: 46vw;
  padding: 32px 16px 32px 16px;
  display: flex;
  gap: 1vw;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  margin-top: 1.2%;
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
  max-height: 50vw;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  padding: 32px 16px 32px 16px;
}
.response-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
}
.response-header p {
  font-size: 18px;
}


.news-item {
  margin-bottom: 17px;
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
  max-height: calc(90vh - 60px); /* 减去header的高度 */
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
  gap: 24px;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.news-detail-content {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 1.4em;
  color: #333;
  overflow-y: auto;
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