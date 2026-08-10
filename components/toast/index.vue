<!-- 全局 Toast · 简笔卡通风格 · 薄荷绿底色 + 明黄装饰线 -->
<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="visible" class="toast-wrap" @click="dismiss">
        <div class="toast-body">{{ message }}</div>
        <div class="toast-accent" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const visible = ref(false)
const message = ref('')
let timer = null

function show(msg, duration = 3000) {
  if (timer) { clearTimeout(timer); visible.value = false }
  message.value = typeof msg === 'string' ? msg : String(msg || '')
  visible.value = true
  timer = setTimeout(() => { visible.value = false; timer = null }, duration)
}

function dismiss() {
  visible.value = false
  if (timer) { clearTimeout(timer); timer = null }
}

onBeforeUnmount(() => {
  if (timer) { clearTimeout(timer); timer = null }
})

defineExpose({ show })
</script>

<style scoped>
.toast-wrap {
  position: fixed; bottom: calc(env(safe-area-inset-bottom) + 40px);
  left: 50%; transform: translateX(-50%); z-index: 9999;
  display: flex; align-items: center; pointer-events: auto; cursor: pointer;
  transition: transform 0.1s ease;
}
.toast-wrap:active { transform: translateX(-50%) scale(0.96); }

.toast-body {
  height: 36px; min-width: 120px; max-width: 320px;
  padding: 0 16px; background: #B8E6E1;
  border: 1.5px solid #48A9A6; border-radius: 6px;
  color: #245957; font-size: 13px; font-weight: bold;
  line-height: 36px; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* 右侧明黄装饰短线 */
.toast-accent {
  width: 3px; height: 14px;
  background: #FFD133; border-radius: 1.5px;
  margin-left: -2px; flex-shrink: 0;
}

/* 入场：向下滑入 + 淡入 */
.toast-fade-enter-active { transition: opacity .3s ease-out, transform .3s ease-out; }
.toast-fade-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* 离场：向上滑出 + 淡出 */
.toast-fade-leave-active { transition: opacity .25s ease-in, transform .25s ease-in; }
.toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>
