import { createRouter, createWebHistory } from 'vue-router'
import Login from './pages/Login.vue'
import Dashboard from './pages/Dashboard.vue'
import InspeksiForm from './pages/InspeksiForm.vue'
import FindingsForm from './pages/FindingsForm.vue'
import Report from './pages/Report.vue'
import FindingsList from './pages/FindingsList.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/inspeksi', component: InspeksiForm, meta: { requiresAuth: true } },
  { path: '/inspeksi/:id/findings', component: FindingsForm, meta: { requiresAuth: true } },
  { path: '/report', component: Report, meta: { requiresAuth: true } },
  { path: '/inspeksi/:id/listfindings', component: FindingsList },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Proteksi route
router.beforeEach((to) => {
  const user = localStorage.getItem('user') // pakai localStorage/sessionStorage
  const isAuthenticated = !!user

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login' // redirect jika belum login
  } else if (to.path === '/login' && isAuthenticated) {
    return '/dashboard' // redirect jika sudah login
  }
  // jangan return apapun kalau tidak redirect → mencegah infinite loop
})

export default router
