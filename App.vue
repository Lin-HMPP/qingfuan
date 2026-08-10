<template>
  <div class="app-root" v-if="!showPinLock">
    <div class="safe-top" />
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <tab-bar v-if="showTabBar" />
    <toast-global ref="toastRef" />
  </div>
  <pin-lock v-else @unlocked="onUnlocked" @done="showPinLock = false" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ToastGlobal from './components/toast/index.vue'
import TabBar from './components/tab-bar/index.vue'
import PinLock from './components/pin-lock/index.vue'
import { locked, checkLock, doUnlock } from './store/lock.js'

const route = useRoute()
const toastRef = ref(null)
const showPinLock = ref(false)

const tabRoutes = ['/home', '/asset-list', '/evidence-folder', '/mine']
const showTabBar = computed(() => tabRoutes.includes(route.path))

onMounted(() => {
  window.__toast = (msg, duration) => {
    // 优先用 Vue Toast 组件
    if (toastRef.value) {
      try { toastRef.value.show(msg, duration); return } catch(e) {}
    }
    // 兜底：DOM 弹层，确保任何情况下都能看到提示
    const el = document.createElement('div')
    el.textContent = msg
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(0,0,0,.82);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;max-width:300px;text-align:center;pointer-events:none;'
    document.body.appendChild(el)
    setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(() => el.remove(), 300) }, (duration || 3000))
  }
  window.__showPin = (mode) => { window.__pinMode = mode; showPinLock.value = true }
  checkLock()
  if (locked.value) showPinLock.value = true
  // 加载完成，隐藏启动屏
  const loading = document.getElementById('app-loading')
  if (loading) {
    loading.classList.add('done')
    setTimeout(() => loading.remove(), 400)
  }
})

function onUnlocked() { doUnlock(); showPinLock.value = false }
</script>

<style lang="scss">
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #F5FAFA; color: #245957; font-size: 14px; -webkit-tap-highlight-color: transparent; }
#app { min-height: 100vh; background: #F5FAFA; }
.safe-top { height: env(safe-area-inset-top, 0px); background: #fff; }
.app-root { position: relative; min-height: 100vh; }
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.2s ease; }
.page-fade-enter-from, .page-fade-leave-to { opacity: 0; }
.card-blue { background: #fff; border: 1.5px solid #48A9A6; border-radius: 16px; transition: transform 0.15s ease, background 0.15s ease; }
.card-blue:active { transform: scale(0.97); }
.card-light { background: #B8E6E1; border-radius: 8px; }
.btn-primary { display: flex; align-items: center; justify-content: center; height: 44px; background: #48A9A6; color: #fff; border-radius: 6px; font-size: 15px; font-weight: bold; border: none; cursor: pointer; transition: transform 0.1s ease, background 0.1s ease; }
.btn-primary:active { transform: scale(0.96); background: #9FD8D2; }
.btn-secondary { display: flex; align-items: center; justify-content: center; height: 44px; background: #fff; color: #48A9A6; border: 1.5px solid #48A9A6; border-radius: 6px; font-size: 15px; font-weight: bold; cursor: pointer; transition: transform 0.1s ease, background 0.1s ease, border-width 0.1s ease; }
.btn-secondary:active { transform: scale(0.96); background: #B8E6E1; border-width: 2px; }
.input-blue { width: 100%; height: 44px; background: #fff; border: 1.5px solid #48A9A6; border-radius: 12px; padding: 0 12px; font-size: 15px; color: #245957; outline: none; }
.input-blue::placeholder { color: #4A7A77; }
.input-blue:focus { border-color: #48A9A6; box-shadow: 0 0 0 2px rgba(72,169,166,.2); }
.textarea-blue { width: 100%; min-height: 100px; background: #fff; border: 1.5px solid #48A9A6; border-radius: 12px; padding: 12px; font-size: 15px; color: #245957; outline: none; resize: vertical; }
.textarea-blue::placeholder { color: #4A7A77; }
.divider-blue { height: 0.5px; background: #48A9A6; opacity: 0.4; }
.nav-bar { display: flex; align-items: center; height: 44px; background: #fff; padding: 0 16px; position: relative; border-bottom: 1px solid #48A9A6; }
.nav-bar .back { font-size: 15px; color: #48A9A6; cursor: pointer; z-index: 1; }
.nav-bar .title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; white-space: nowrap; }
.disclaimer { display: block; text-align: center; font-size: 11px; color: #4A7A77; padding: 8px 16px; }
.flex-1 { flex: 1; }
</style>
