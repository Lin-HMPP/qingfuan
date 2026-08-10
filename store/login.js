/**
 * 青付安 — 登录状态管理 (Pinia)
 * 对应 PRD §5.2 全局数据&登录规则
 */
import { defineStore } from 'pinia'
import { getAccount, saveAccount, clearAccount } from '@/common/storage.js'

export const useLoginStore = defineStore('login', {
  state: () => {
    const acc = getAccount()
    return {
      phone: acc.phone || '',
      token: acc.token || '',
      loggedIn: acc.loggedIn || false,
      loginTime: acc.loginTime || 0
    }
  },

  getters: {
    isLoggedIn: (state) => state.loggedIn,
    maskedPhone: (state) => {
      if (!state.phone) return ''
      return state.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }
  },

  actions: {
    /** 登录 */
    login(phone, token) {
      this.phone = phone
      this.token = token
      this.loggedIn = true
      this.loginTime = Date.now()
      saveAccount({
        phone, token,
        loggedIn: true,
        loginTime: this.loginTime
      })
    },

    /** 退出登录（仅清除缓存，不动资产） */
    logout() {
      this.phone = ''
      this.token = ''
      this.loggedIn = false
      this.loginTime = 0
      clearAccount()
    },

    /** 检查是否需要登录拦截 */
    requireLogin() {
      if (!this.loggedIn) {
        const ok = window.confirm('需要登录\n\n云端同步功能需要登录后使用。继续使用本地功能？\n\n点击"确定"继续本地使用，点击"取消"去登录')
        if (!ok) {
          window.__showPin?.('verify')
        }
        return false
      }
      return true
    }
  }
})
