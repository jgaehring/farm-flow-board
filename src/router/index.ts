import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '@/demo/views/WelcomeView.vue'
import DemoView from '@/demo/views/DemoView.vue'
import BoardView from '@/views/BoardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BoardView
    },
    {
      path: '/demo',
      name: 'demo',
      component: DemoView,
      children: [
        {
          path: '',
          name: 'welcome',
          component: WelcomeView,
        },
        {
          path: 'about',
          name: 'about',
          // route level code-splitting
          // this generates a separate chunk (About.[hash].js) for this route
          // which is lazy-loaded when the route is visited.
          component: () => import('@/demo/views/AboutView.vue')
        }
      ],
    },
  ]
})

export default router
