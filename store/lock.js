import { ref } from 'vue'

// 全局锁状态（响应式，所有页面共享）
export const locked = ref(false)
// 运行时锁定横幅（与启动时 PIN 锁屏区分）
export const showLockBanner = ref(false)

export function checkLock() {
  const hasPin = !!localStorage.getItem('qf_pin_hash')
  const unlocked = localStorage.getItem('qf_unlocked') === '1'

  // 修复残留状态：如果有 pin_hash 但没有 unlocked，可能是用户不清楚如何解锁
  // 这种情况下显示横幅引导解锁，而不是静默拦截所有按钮
  if (hasPin && !unlocked) {
    locked.value = true
    // 启动时不自动显示 PIN 锁屏，而是让 App.vue 控制
    // showLockBanner 由 App.vue 在路由加载后设置
    return true // 返回 true 表示需要显示锁屏
  }

  // 正常状态：无 PIN 或已解锁
  locked.value = false
  showLockBanner.value = false
  return false
}

export function doLock() {
  localStorage.removeItem('qf_unlocked')
  locked.value = true
  showLockBanner.value = true  // 运行时锁定，显示横幅
}

export function doUnlock() {
  localStorage.setItem('qf_unlocked', '1')
  locked.value = false
  showLockBanner.value = false
  window.dispatchEvent(new Event('app-unlocked'))
}
