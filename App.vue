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

/* ——— 卡片：薄荷绿轮廓 + 明黄角装饰 ——— */
.card-blue {
  background: #fff; border: 1.5px solid #48A9A6; border-radius: 16px;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  position: relative;
}
/* 左上角明黄短折线装饰 */
.card-blue::before {
  content: ''; position: absolute; top: -1px; left: 12px;
  width: 14px; height: 2px; background: #FFD133; border-radius: 1px;
}
/* 右下角明黄短折线装饰（仅大卡片） */
.card-blue.card-decor::after {
  content: ''; position: absolute; bottom: -1px; right: 12px;
  width: 14px; height: 2px; background: #FFD133; border-radius: 1px;
}
.card-blue:active { transform: scale(0.97); }

.card-light {
  background: #B8E6E1; border-radius: 8px;
  position: relative;
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

/* ——— 导航栏：薄荷绿底线 + 明黄平行装饰线 ——— */
.nav-bar {
  display: flex; align-items: center; height: 44px;
  background: #fff; padding: 0 16px; position: relative;
  border-bottom: 1.5px solid #48A9A6;
}
.nav-bar::after {
  content: ''; position: absolute; bottom: -4px; left: 16px; right: 16px;
  height: 1px; background: #FFD133; border-radius: 0.5px;
}
.nav-bar .back { font-size: 15px; color: #48A9A6; cursor: pointer; z-index: 1; }
.nav-bar .back:active { transform: scale(0.96); color: #9FD8D2; }
.nav-bar .title {
  position: absolute; left: 50%; transform: translateX(-50%);
  font-size: 18px; font-weight: bold; color: #245957; white-space: nowrap;
}
/* 标题底部短明黄装饰线 */
.nav-bar .title::after {
  content: ''; display: block; width: 20px; height: 2px;
  background: #FFD133; border-radius: 1px; margin: 1px auto 0;
}

/* ——— 全局免责声明 ——— */
.disclaimer { display: block; text-align: center; font-size: 11px; color: #4A7A77; padding: 8px 16px; }

/* ——— 全局可点击元素按压反馈 ——— */
a, button, [role="button"], .clickable,
.tag, .menu-item, .folder-card, .record-item, .asset-card,
.btn-writeoff, .btn-voucher, .btn-add, .btn-manage,
.option, .type-item, .num-key, .tab, .lock-btn {
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease, opacity 0.12s ease;
}
.tag:active, .menu-item:active, .folder-card:active, .record-item:active,
.asset-card:active, .btn-writeoff:active, .btn-voucher:active, .btn-add:active,
.option:active, .type-item:active, .num-key:active, .tab:active {
  transform: scale(0.96); background: #9FD8D2;
}

/* ——— 通用工具类 ——— */
.flex-1 { flex: 1; }
</style>
