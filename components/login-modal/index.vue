<!-- 登录/注册弹窗 · 手机号+验证码 · 对应线框图 🔐 登录/注册弹窗-美化版 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="close-btn" @click="$emit('close')">✕</div>

      <!-- Tab -->
      <div class="tabs">
        <div class="tab" :class="{ active: tab === 'login' }" @click="tab = 'login'">登录</div>
        <div class="tab" :class="{ active: tab === 'register' }" @click="tab = 'register'">注册</div>
      </div>
      <div class="tab-underline" :class="{ right: tab === 'register' }" />

      <!-- 手机号 -->
      <div class="input-row">
        <span class="prefix">+86</span>
        <div class="prefix-divider" />
        <input class="flex-1" v-model="phone" type="number" maxlength="11" placeholder="请输入手机号" />
      </div>

      <!-- 验证码 -->
      <div class="code-row">
        <input class="input-code" v-model="code" type="number" maxlength="6" placeholder="请输入验证码" />
        <div class="btn-code" :class="{ counting }" @click="sendCode">
          {{ counting ? count + 's后重试' : '获取验证码' }}
        </div>
      </div>

      <!-- 协议勾选 -->
      <div class="agree-row">
        <div class="checkbox" :class="{ checked }" @click="checked = !checked" />
        <span>我已阅读并同意</span>
        <span class="link">《隐私政策》</span>
        <span>和</span>
        <span class="link">《用户协议》</span>
      </div>

      <!-- 登录按钮 -->
      <div class="btn-submit" :class="{ active: canSubmit }" @click="onSubmit">
        {{ tab === 'login' ? '登  录' : '注  册' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLoginStore } from '@/store/login.js'
import { isValidPhone, isValidCode } from '@/common/validator.js'

const $toast = (msg) => window.__toast?.(msg)
const login = useLoginStore()
const emit = defineEmits(['close'])

const tab = ref('login')
const phone = ref('')
const code = ref('')
const checked = ref(false)
const counting = ref(false)
const count = ref(60)

const canSubmit = computed(() => isValidPhone(phone.value) && isValidCode(code.value) && checked.value)

function sendCode() {
  if (counting.value) return
  if (!isValidPhone(phone.value)) { $toast?.('请输入正确的手机号'); return }
  counting.value = true
  const timer = setInterval(() => {
    count.value--
    if (count.value <= 0) { clearInterval(timer); counting.value = false; count.value = 60 }
  }, 1000)
  $toast?.('验证码已发送')
}

function onSubmit() {
  if (!checked.value) { $toast?.('请阅读并同意隐私政策'); return }
  if (!canSubmit.value) { $toast?.('请完善登录信息'); return }
  login.login(phone.value, 'token_' + Date.now())
  $toast?.('登录成功')
  emit('close')
}
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border-radius: 16px; padding: 18px 24px 24px; box-shadow: 0 4px 16px rgba(0,0,0,.15); position: relative; }
.close-btn { position: absolute; top: 16px; right: 16px; width: 28px; height: 28px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.close-btn text { font-size: 16px; color: #638F8D; }

.tabs { display: flex; }
.tab { flex: 1; text-align: center; padding: 10px 0; font-size: 16px; color: #638F8D; }
.tab.active { color: #333; font-weight: bold; }
.tab-underline { width: 32px; height: 2px; background: #48A9A6; border-radius: 1px; margin-left: 50px; transition: transform .2s; }
.tab-underline.right { transform: translateX(148px); }

.input-row { display: flex; align-items: center; height: 44px; background: #F5F7FA; border-radius: 8px; padding: 0 12px; margin-top: 18px; }
.prefix { font-size: 14px; color: #638F8D; }
.prefix-divider { width: 0.5px; height: 20px; background: #B8E6E1; margin: 0 12px; }
.flex-1 { flex: 1; font-size: 14px; color: #245957; }

.code-row { display: flex; gap: 12px; margin-top: 16px; }
.input-code { flex: 1; height: 44px; background: #F5F7FA; border-radius: 8px; padding: 0 12px; font-size: 14px; }
.btn-code { width: 105px; height: 44px; border: 1px solid #48A9A6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; color: #48A9A6; }
.btn-code.counting { background: #F0F0F0; border-color: #F0F0F0; color: #638F8D; }

.agree-row { display: flex; align-items: center; margin-top: 20px; font-size: 12px; color: #638F8D; flex-wrap: wrap; }
.checkbox { width: 16px; height: 16px; border: 1px solid #EEE; border-radius: 3px; margin-right: 8px; }
.checkbox.checked { background: #48A9A6; border-color: #48A9A6; }
.link { color: #48A9A6; }

.btn-submit { height: 48px; background: #C6E0FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-top: 20px; font-size: 16px; font-weight: bold; color: #fff; }
.btn-submit.active { background: #48A9A6; }
</style>
