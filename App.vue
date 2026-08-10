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

/* ——— 黄色强调体系（第二主题色 #FFD133） ——— */
.accent-yellow { color: #E8B800; }
.bg-yellow-soft { background: #FFF8E1; }
.badge-yellow {
  display: inline-block; padding: 2px 8px;
  background: #FFF8E1; color: #C79100;
  border: 1px solid #FFD133; border-radius: 4px;
  font-size: 10px; font-weight: bold;
}

/* ——— 通用工具类 ——— */
.flex-1 { flex: 1; }
</style>
