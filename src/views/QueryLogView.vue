<template>
  <div class="home-layout">
    <Sidebar />
    <div class="main-content">
      <h1>查询日志列表</h1>
      <div class="search-bar-row">
        <el-input v-model="searchQuery" placeholder="请输入ID查询" class="search-input" size="large" />
        <el-button 
          :type="isSortedByTime ? 'success' : 'primary'" 
          @click="toggleSort" 
          class="sort-button" 
          size="large"
        >
          {{ isSortedByTime ? '恢复正常顺序' : '按执行时间排序' }}
        </el-button>
      </div>
    
      <div v-if="isLoading" class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      <el-table
        v-else-if="logs.length > 0"
        :data="logs"
        stripe
        class="element-table"
      >
        <el-table-column prop="id" label="ID" width="180">
          <template #default="scope">
            #{{ scope.row.id }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="240" />
        <el-table-column prop="executionTime" label="执行时间(ms)" width="240">
          <template #default="scope">
            <span>
              {{ scope.row.executionTime }}ms
            </span>
            <el-progress
              :percentage="Math.min(scope.row.executionTime / 200 * 100, 100)"
              :stroke-color="scope.row.executionTime / 200 * 100 > 80 ? '#ef4444' : scope.row.executionTime > 50 ? '#f59e42' : '#22c55e'"
              :show-text="false"
              :stroke-width="6"      
              style="width: 80px; margin-left: 8px;"      
              status="success"
            />
          </template>
        </el-table-column>
        <el-table-column prop="querySql" label="SQL 查询语句">
          <template #default="scope">
            <div class="sql-single-line">{{ scope.row.querySql }}</div>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="p-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <i class="fa fa-search text-gray-400 text-2xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-1">没有找到查询日志</h3>
        <p class="text-sm text-gray-500">尝试刷新页面或调整搜索条件</p>
        <button 
          @click="fetchLogs" 
          class="mt-4 bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          刷新页面
        </button>
      </div>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
// 引入Element Plus进度条组件
import { ElProgress } from 'element-plus';

const logs = ref([]);
const searchQuery = ref('');
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const isSortedByTime = ref(false);

const filteredLogs = computed(() => {
  if (!searchQuery.value.trim()) return logs.value;
  const query = searchQuery.value.toLowerCase();
  return logs.value.filter(log => 
    log.querySql.toLowerCase().includes(query) || 
    log.id.toString().includes(query)
  );
});

const fetchLogs = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get(`http://localhost:8080/api/querylogs/logs`, {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    });
    
    if (res.data && res.data.records) {
      logs.value = res.data.records.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));
      total.value = res.data.total;
    } else {
      console.error('API返回的数据格式不正确:', res.data);
      logs.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取日志失败:', error);
    alert('获取日志失败，请检查网络连接或API配置');
  } finally {
    isLoading.value = false;
  }
};

const fetchSortedLogs = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get(`http://localhost:8080/api/querylogs/sorted-by-execution-time`, {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    });
    
    if (res.data && res.data.records) {
      logs.value = res.data.records.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));
      total.value = res.data.total;
    } else {
      console.error('API返回的数据格式不正确:', res.data);
      logs.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取排序日志失败:', error);
    alert('获取排序日志失败，请检查网络连接或API配置');
  } finally {
    isLoading.value = false;
  }
};

const toggleSort = () => {
  isSortedByTime.value = !isSortedByTime.value;
  if (isSortedByTime.value) {
    fetchSortedLogs();
  } else {
    fetchLogs();
  }
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchLogs();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchLogs();
};

onMounted(() => {
  fetchLogs();
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

.element-table {
  width: 100%;
  background: #fff;
  margin-bottom: 20px;
}

.progress-bar {
}

.sql-single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-input {
  width: 15vw;
  margin-bottom: 1vw;
  margin-top: 0.5vw;
}

.search-bar-row {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.sort-button {
  margin-left: 0.5vw;
  margin-bottom: 1vw;
  margin-top: 0.5vw;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>