<template>
  <div class="tab-bar">
    <div v-for="t in tabs" :key="t.path"
      class="tab" :class="{ active: route.path === t.path }"
      @click="switchTab(t.path)">
      <div class="tab-icon">
        <!-- 首页 -->
        <svg v-if="t.path === '/home'" width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="route.path === t.path ? '#48A9A6' : '#638F8D'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <!-- 资产 -->
        <svg v-else-if="t.path === '/asset-list'" width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="route.path === t.path ? '#48A9A6' : '#638F8D'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="12" y1="8" x2="12" y2="21"/></svg>
        <!-- 证据夹 -->
        <svg v-else-if="t.path === '/evidence-folder'" width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="route.path === t.path ? '#48A9A6' : '#638F8D'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <!-- 我的 -->
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="route.path === t.path ? '#48A9A6' : '#638F8D'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <span class="tab-label">{{ t.label }}</span>
      <div v-if="route.path === t.path" class="tab-indicator" />
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const tabs = [
  { path: '/home', label: '首页' },
  { path: '/asset-list', label: '资产' },
  { path: '/evidence-folder', label: '证据夹' },
  { path: '/mine', label: '我的' },
]

function switchTab(path) { if (route.path !== path) router.push(path) }
</script>

<style scoped>
.tab-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  display: flex; height: 56px; background: #fff;
  border-top: 1px solid #48A9A6;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
@media (min-width: 450px) {
  .tab-bar { width: 375px; left: 50%; transform: translateX(-50%); }
}
.tab {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative; cursor: pointer; padding-top: 2px;
}
.tab-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.tab.active .tab-label { color: #48A9A6; font-weight: bold; }
.tab:not(.active) .tab-label { color: #638F8D; }
.tab-indicator {
  position: absolute; bottom: 6px;
  width: 16px; height: 3px; background: #48A9A6;
  border-radius: 1.5px;
}
</style>
