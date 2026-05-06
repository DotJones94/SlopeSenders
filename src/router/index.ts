import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return new Promise((resolve) => {
        window.setTimeout(() => {
          resolve({
            el: to.hash,
            top: 24,
            behavior: from.name ? 'smooth' : 'auto',
          })
        }, 150)
      })
    }

    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Landing.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
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
