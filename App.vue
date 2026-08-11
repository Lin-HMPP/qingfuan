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
    <!-- 运行时锁横幅：locked=true 但未显示 PIN 锁屏时出现 -->
    <div class="lock-banner" v-if="showLockBanner && !showPinLock" @click="openUnlock">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="margin-right:6px"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      信息已锁定 · 点击解锁
    </div>
  </div>
  <pin-lock v-else @unlocked="onUnlocked" @done="onPinDone" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ToastGlobal from './components/toast/index.vue'
import TabBar from './components/tab-bar/index.vue'
import PinLock from './components/pin-lock/index.vue'
import { locked, showLockBanner, checkLock, doUnlock } from './store/lock.js'

const route = useRoute()
const toastRef = ref(null)
const showPinLock = ref(false)

const tabRoutes = ['/home', '/asset-list', '/evidence-folder', '/mine']
const showTabBar = computed(() => tabRoutes.includes(route.path))

onMounted(() => {
  window.__toast = (msg, duration) => {
    if (toastRef.value) {
      try { toastRef.value.show(msg, duration); return } catch(e) {}
    }
    const el = document.createElement('div')
    el.textContent = msg
    el.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(0,0,0,.82);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;max-width:300px;text-align:center;pointer-events:none;'
    document.body.appendChild(el)
    setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(() => el.remove(), 300) }, (duration || 3000))
  }
  window.__showPin = (mode) => { window.__pinMode = mode; showPinLock.value = true }
  const needPinScreen = checkLock()
  if (needPinScreen) {
    // 启动时检测到锁状态，显示 PIN 解锁界面
    showPinLock.value = true
  } else {
    showPinLock.value = false
  }
  const loading = document.getElementById('app-loading')
  if (loading) {
    loading.classList.add('done')
    setTimeout(() => loading.remove(), 400)
  }
})

function onUnlocked() { doUnlock(); showPinLock.value = false; window.__pinMode = undefined }
function onPinDone() { showPinLock.value = false; window.__pinMode = undefined }
function openUnlock() {
  // 从锁横幅点击解锁 → 打开 PIN 验证界面
  showPinLock.value = true
}
</script>

<style lang="scss">
/* ═══════════════════════════════════════════
   青付安 — 简笔卡通线条 UI 全局样式 V2
   薄荷绿主体 + 明黄装饰线 + 按压反馈
   ═══════════════════════════════════════════ */

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #FFFFFF; color: #245957; font-size: 14px; -webkit-tap-highlight-color: transparent; }
#app { min-height: 100vh; background: #FFFFFF; }
.safe-top { height: env(safe-area-inset-top, 0px); background: #fff; }
.app-root { position: relative; min-height: 100vh; }

/* ——— 页面过渡 ——— */
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.page-fade-enter-from { opacity: 0; transform: translateX(8px); }
.page-fade-leave-to { opacity: 0; transform: translateX(-8px); }

/* ——— 卡片：薄荷绿轮廓 ——— */
.card-blue {
  background: #fff; border: 1.5px solid #48A9A6; border-radius: 16px;
  transition: transform 0.15s ease, background 0.15s ease;
}
.card-blue:active { transform: scale(0.97); }

.card-light {
  background: #B8E6E1; border-radius: 8px;
}

/* ——— 主按钮：薄荷绿填充 + 按压加深 ——— */
.btn-primary {
  display: flex; align-items: center; justify-content: center;
  height: 44px; background: #48A9A6; color: #fff;
  border-radius: 6px; font-size: 15px; font-weight: bold;
  border: none; cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
}
.btn-primary:active { transform: scale(0.96); background: #9FD8D2; }

/* ——— 次按钮：白底薄荷绿边框 ——— */
.btn-secondary {
  display: flex; align-items: center; justify-content: center;
  height: 44px; background: #fff; color: #48A9A6;
  border: 1.5px solid #48A9A6; border-radius: 6px;
  font-size: 15px; font-weight: bold; cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
}
.btn-secondary:active { transform: scale(0.96); background: #B8E6E1; }

/* ——— 输入框 ——— */
.input-blue {
  width: 100%; height: 44px; background: #fff;
  border: 1.5px solid #48A9A6; border-radius: 12px;
  padding: 0 12px; font-size: 15px; color: #245957; outline: none;
}
.input-blue::placeholder { color: #4A7A77; }
.input-blue:focus { border-color: #48A9A6; box-shadow: 0 0 0 2px rgba(72,169,166,.15); }

.textarea-blue {
  width: 100%; min-height: 100px; background: #fff;
  border: 1.5px solid #48A9A6; border-radius: 12px;
  padding: 12px; font-size: 15px; color: #245957; outline: none; resize: vertical;
}
.textarea-blue::placeholder { color: #4A7A77; }

/* ——— 分割线：薄荷绿 + 明黄双线装饰 ——— */
.divider-blue {
  height: 0.5px; background: #48A9A6; opacity: 0.4;
  position: relative;
}

/* ——— 导航栏 ——— */
.nav-bar {
  display: flex; align-items: center; height: 44px;
  background: #fff; padding: 0 16px; position: relative;
  border-bottom: 1px solid #48A9A6;
}
.nav-bar .back { font-size: 15px; color: #48A9A6; cursor: pointer; z-index: 1; }
.nav-bar .back:active { transform: scale(0.96); }
.nav-bar .title {
  position: absolute; left: 50%; transform: translateX(-50%);
  font-size: 18px; font-weight: bold; color: #245957; white-space: nowrap;
}

/* ——— 全局免责声明 ——— */
.disclaimer { display: block; text-align: center; font-size: 11px; color: #4A7A77; padding: 8px 16px; }

/* ——— 通用工具类 ——— */
.flex-1 { flex: 1; }

/* 运行时锁横幅 */
.lock-banner {
  position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); z-index: 9000;
  display: flex; align-items: center; justify-content: center;
  padding: 10px 20px; background: #245957; color: #fff;
  border-radius: 20px; font-size: 13px; font-weight: bold;
  box-shadow: 0 4px 16px rgba(0,0,0,.25); cursor: pointer;
  animation: bannerIn .3s ease;
  white-space: nowrap;
}
@keyframes bannerIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
