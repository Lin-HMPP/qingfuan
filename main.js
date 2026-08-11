import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

// 页面组件（懒加载）
const routes = [
  { path: '/',              redirect: '/home' },
  { path: '/home',          component: () => import('./pages/index/index.vue') },
  { path: '/quick-input',   component: () => import('./pages/quick-input/index.vue') },
  { path: '/package-input', component: () => import('./pages/package-input/index.vue') },
  { path: '/decision-card', component: () => import('./pages/decision-card/index.vue') },
  { path: '/risk-report',   component: () => import('./pages/risk-report/index.vue') },
  { path: '/asset-list',    component: () => import('./pages/asset-list/index.vue') },
  { path: '/asset-detail',  component: () => import('./pages/asset-detail/index.vue') },
  { path: '/write-off',     component: () => import('./pages/write-off/index.vue') },
  { path: '/evidence-folder', component: () => import('./pages/evidence-folder/index.vue') },
  { path: '/folder-create', component: () => import('./pages/folder-create/index.vue') },
  { path: '/mine',          component: () => import('./pages/mine/index.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 全局 Toast 方法
app.config.globalProperties.$toast = (msg) => {
  // 由 App.vue 中的 toast 组件处理
  window.__toast?.(msg)
}

app.mount('#app')

// 自毁旧 Service Worker（如果之前安装过）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
}
