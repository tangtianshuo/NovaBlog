import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import DocumentDetail from '@/pages/DocumentDetail.vue'
import Login from '@/pages/Login.vue'
import Editor from '@/pages/Editor.vue'
import Admin from '@/pages/Admin.vue'
import { useAuthStore } from '@/stores/auth'

// Define route configuration
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/doc/:id',
    name: 'document-detail',
    component: DocumentDetail,
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/editor',
    name: 'editor',
    component: Editor,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: Admin,
    meta: { requiresAuth: true }
  }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router