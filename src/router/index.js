import { createRouter, createWebHistory } from 'vue-router'
import QueryLogView from '@/views/QueryLogView.vue'
import Home from '../views/Home.vue'
import NewsLifecycleView from '../views/NewsLifecycleView.vue'
import NewsRecommendationView from '../views/NewsRecommendation.vue'
import PopularNewsView from '../views/PopularNewsView.vue'
import ComplexQueryView from '../views/ComplexQuery.vue'
import NewsTypeView from '../views/NewsType.vue'
import UserInterestView from '../views/UserInterest.vue'

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
  },
  {
    path: '/lifecycle',
    name: 'NewsLifecycle',
    component: NewsLifecycleView
  },
  {
    path: '/newsRecommendation',
    name: 'NewsRecommendation',
    component: NewsRecommendationView
  },
  {
    path: '/popularnews',
    name: 'PopularNews',
    component: PopularNewsView
  },
  {
    path: '/complexquery',
    name: 'ComplexQuery',
    component: ComplexQueryView
  },
  {
    path: '/newstype',
    name: 'NewsType',
    component: NewsTypeView
  },
  {
    path: '/userinterest',
    name: 'UserInterest',
    component: UserInterestView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 