import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/category/:slug',
      name: 'category',
      component: () => import('@/components/CategoryDetail.vue'),
    },
  ],
})

export default router
