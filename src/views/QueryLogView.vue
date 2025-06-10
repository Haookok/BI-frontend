<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">查询日志列表</h2>
      <button 
        @click="fetchLogs" 
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center"
      >
        <i class="fa fa-refresh mr-2"></i>刷新日志
      </button>
    </div>
    
    <div class="mb-6">
      <div class="relative">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索SQL语句或ID" 
          class="w-full max-w-md pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        >
        <i class="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      </div>
    </div>
    
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="filteredLogs.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">执行时间(ms)</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SQL 查询语句</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-gray-50 transition-colors duration-150">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{{ log.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.createdAt }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span 
                    :class="log.executionTime > 100 ? 'text-red-500' : log.executionTime > 50 ? 'text-yellow-500' : 'text-green-500'"
                    class="text-sm font-medium mr-2"
                  >
                    {{ log.executionTime }}ms
                  </span>
                  <div class="w-20 bg-gray-200 rounded-full h-1.5">
                    <div 
                      :class="log.executionTime > 100 ? 'bg-red-500' : log.executionTime > 50 ? 'bg-yellow-500' : 'bg-green-500'"
                      class="h-1.5 rounded-full"
                      :style="{ width: log.executionTime / 200 * 100 + '%' }"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 max-w-xs">
                <div class="text-sm text-gray-900 truncate">{{ log.querySql }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

// 状态管理
const logs = ref([]);
const searchQuery = ref('');
const isLoading = ref(false);

// 计算属性：过滤日志
const filteredLogs = computed(() => {
  if (!searchQuery.value.trim()) return logs.value;
  const query = searchQuery.value.toLowerCase();
  return logs.value.filter(log => 
    log.querySql.toLowerCase().includes(query) || 
    log.id.toString().includes(query)
  );
});

// 获取日志数据
const fetchLogs = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get('http://localhost:8080/api/querylogs');
    
    if (Array.isArray(res.data)) {
      logs.value = res.data.map(item => ({
        ...item,
        // 使用原生JavaScript格式化日期
        createdAt: new Date(item.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));
    } else {
      console.error('API返回的数据不是数组:', res.data);
      logs.value = [];
    }
  } catch (error) {
    console.error('获取日志失败:', error);
    alert('获取日志失败，请检查网络连接或API配置');
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
/* 引入Tailwind CSS工具类 */
@tailwind utilities;

/* 进度条动画 */
.progress-bar {
  transition: width 0.5s ease-in-out;
}
</style>