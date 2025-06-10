import { createRouter, createWebHistory } from 'vue-router'
import QueryLogView from '@/views/QueryLogView.vue'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
    {
    path: '/querylogs',
    name: 'QueryLogs',
    component: QueryLogView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 