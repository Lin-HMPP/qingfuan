<template>
  <div class="mask">
    <div class="modal" @click.stop>
      <div class="lock-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#48A9A6" stroke-width="1.5">
          <rect x="10" y="18" width="20" height="16" rx="3"/><path d="M14 18v-4a6 6 0 0 1 12 0v4"/><circle cx="20" cy="26" r="2"/><line x1="20" y1="28" x2="20" y2="30"/>
        </svg>
      </div>
      <span class="title">{{ titleText }}</span>
      <span class="hint">{{ hintText }}</span>

      <div class="pin-dots">
        <div class="dot" v-for="i in 6" :key="i" :class="{ filled: pin.length >= i }" />
      </div>

      <div class="num-pad">
        <div v-for="(n, i) in keys" :key="i"
          :class="['num-key', { empty: n === -1, confirm: n === -2 }]"
          @click="handleClick(n)">
          <template v-if="n === -2">确认</template>
          <template v-else-if="n === -1" />
          <template v-else-if="n === -3">⌫</template>
          <template v-else>{{ n }}</template>
        </div>
      </div>

      <span class="error-msg" v-if="error">{{ error }}</span>
      <span class="reset-link" v-if="step !== 0" @click="resetAll">重置 PIN 码</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['unlocked', 'done'])

const hasPin = !!localStorage.getItem('qf_pin_hash')
// 根据调用方意图决定初始模式：setup=强制重设PIN, verify=验证现有PIN
const mode = window.__pinMode || (hasPin ? 'verify' : 'setup')
const step = ref(mode === 'setup' ? 1 : 0)  // 0=验证, 1=首次输入, 2=二次确认
const pin = ref('')
const saved = ref('')
const error = ref('')

const keys = [1,2,3,4,5,6,7,8,9,-2,0,-3]  // -2=确认, -3=删除

const titleText = computed(() => {
  if (step.value === 1) return '设置安全 PIN 码'
  if (step.value === 2) return '请再次输入确认'
  return '输入 PIN 码解锁'
})

const hintText = computed(() => {
  if (step.value === 1) return '设置 4-6 位数字密码，点击确认保存'
  if (step.value === 2) return '请再次输入相同 PIN 码并确认'
  return '输入已设置的 PIN 码，点击确认解锁'
})

function handleClick(n) {
  if (n === -1) return
  if (n === -2) return confirm()
  if (n === -3) return del()
  type(n)
}

function type(n) {
  if (pin.value.length >= 6) return
  pin.value += String(n)
  error.value = ''
}

function resetAll() {
  localStorage.removeItem('qf_pin_hash')
  localStorage.removeItem('qf_unlocked')
  pin.value = ''; saved.value = ''; error.value = ''; step.value = 1
}

function del() {
  pin.value = pin.value.slice(0, -1)
  error.value = ''
}

function confirm() {
  const val = pin.value
  if (val.length < 4) { error.value = '请至少输入 4 位密码'; return }

  // Step 1: 首次设置
  if (step.value === 1) {
    saved.value = val
    pin.value = ''
    step.value = 2
    error.value = ''
    return
  }

  // Step 2: 二次确认
  if (step.value === 2) {
    if (val !== saved.value) {
      error.value = '两次输入不一致，请重新设置'
      pin.value = ''; saved.value = ''; step.value = 1
      return
    }
    const h = btoa('qf_' + val).slice(0, 32)
    localStorage.setItem('qf_pin_hash', h)
    localStorage.removeItem('qf_unlocked')  // 设为锁定状态
    pin.value = ''; saved.value = ''; error.value = ''
    emit('done')  // 关闭弹窗，但保持锁定
    return
  }

  // Step 0: 验证解锁
  const h = btoa('qf_' + val).slice(0, 32)
  if (h === localStorage.getItem('qf_pin_hash')) {
    localStorage.setItem('qf_unlocked', '1')
    emit('unlocked')
  } else {
    error.value = 'PIN 码错误，请重试'
    pin.value = ''
  }
}
</script>

<style scoped>
.mask { position: fixed; inset: 0; z-index: 5000; background: rgba(36,89,87,.5); display: flex; align-items: center; justify-content: center; }
.modal {
  width: 320px; background: #fff; border: 1.5px solid #48A9A6; border-radius: 16px;
  padding: 28px 24px 24px; display: flex; flex-direction: column; align-items: center;
  animation: modal-in 0.25s ease;
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.lock-icon { margin-bottom: 12px; }
.title { font-size: 18px; font-weight: bold; color: #245957; }

.pin-dots { display: flex; gap: 12px; margin: 16px 0; }
.dot { width: 14px; height: 14px; border: 2px solid #48A9A6; border-radius: 50%; transition: background .15s; }
.dot.filled { background: #48A9A6; }

.num-pad { display: grid; grid-template-columns: repeat(3, 64px); gap: 8px; }
.num-key {
  height: 48px; display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: #245957; background: #B8E6E1;
  border: 1.5px solid #48A9A6; border-radius: 12px; cursor: pointer;
  transition: transform .1s ease, background .1s ease; user-select: none;
}
.num-key:active { transform: scale(.93); background: #9FD8D2; }
.num-key.empty { border: none; background: transparent; pointer-events: none; }
.num-key.confirm { font-size: 14px; font-weight: bold; background: #48A9A6; color: #fff; border-color: #48A9A6; }
.num-key.confirm:active { background: #9FD8D2; }

.error-msg { color: #E8686A; font-size: 13px; margin-top: 10px; min-height: 18px; }
.reset-link { font-size: 12px; color: #4A7A77; margin-top: 8px; cursor: pointer; text-decoration: underline; }
</style>
