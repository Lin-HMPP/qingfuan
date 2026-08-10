<!-- 全局 Toast · Vue 3 版 · 深色磨砂半透明 · 3秒自动消失 -->
<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="visible" class="toast-wrap" @click="visible = false">
        <div class="toast-body">{{ message }}</div>
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

onBeforeUnmount(() => {
  if (timer) { clearTimeout(timer); timer = null }
})

defineExpose({ show })
</script>

<style scoped>
.toast-wrap {
  position: fixed; bottom: calc(env(safe-area-inset-bottom) + 40px);
  left: 50%; transform: translateX(-50%); z-index: 9999;
  display: flex; justify-content: center; pointer-events: auto; cursor: pointer;
}
.toast-body {
  height: 36px; min-width: 120px; max-width: 320px;
  padding: 0 16px; background: rgba(0,0,0,0.75);
  border-radius: 6px; color: #fff; font-size: 13px;
  line-height: 36px; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: transform 0.1s ease;
}
.toast-body:active { transform: scale(0.96); }
.toast-fade-enter-active { transition: opacity .3s ease-out, transform .3s ease-out; }
.toast-fade-enter-from { opacity: 0; transform: translateX(-50%) translateY(10px); }
.toast-fade-leave-active { transition: opacity .3s ease-in, transform .3s ease-in; }
.toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
