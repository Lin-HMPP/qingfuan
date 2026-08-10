import { ref } from 'vue'

// 全局锁状态（响应式，所有页面共享）
export const locked = ref(false)

export function checkLock() {
  const hasPin = !!localStorage.getItem('qf_pin_hash')
  const unlocked = localStorage.getItem('qf_unlocked') === '1'
  locked.value = hasPin && !unlocked
}

export function doLock() {
  localStorage.removeItem('qf_unlocked')
  locked.value = true
}

export function doUnlock() {
  localStorage.setItem('qf_unlocked', '1')
  locked.value = false
  window.dispatchEvent(new Event('app-unlocked'))
}
