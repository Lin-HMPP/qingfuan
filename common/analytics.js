// 百度统计 + Clarity 事件埋点工具
// 所有调用已内置 try-catch，绝不会因统计代码报错影响正常功能

const COUNTER_KEY = 'qf_visit_log'

// 本地访问日志：不受广告拦截器影响，作为兜底计数
function logVisit() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const log = JSON.parse(localStorage.getItem(COUNTER_KEY) || '{}')
    log[today] = (log[today] || 0) + 1
    // 保留最近 90 天
    const keys = Object.keys(log).sort()
    if (keys.length > 90) {
      keys.slice(0, keys.length - 90).forEach(k => delete log[k])
    }
    localStorage.setItem(COUNTER_KEY, JSON.stringify(log))
  } catch (e) { /* ignore */ }
}

// 页面加载时记录一次访问
logVisit()

export function track(category, action, label, value) {
  try {
    if (window._hmt) {
      const args = ['_trackEvent', category, action]
      if (label !== undefined) args.push(label)
      if (value !== undefined) args.push(String(value))
      window._hmt.push(args)
    }
    if (window.clarity) {
      window.clarity('event', action, category + (label ? ':' + label : ''))
    }
  } catch (e) {
    // 静默失败，绝不阻断业务逻辑
  }
}

// 获取本地统计数据（可在「我的」页面展示或控制台调用）
export function getLocalStats() {
  try {
    const log = JSON.parse(localStorage.getItem(COUNTER_KEY) || '{}')
    const total = Object.values(log).reduce((a, b) => a + b, 0)
    const days = Object.keys(log).length
    return { total, days, log }
  } catch (e) { return { total: 0, days: 0, log: {} } }
}

// 检查第三方统计加载状态
export function checkTrackerStatus() {
  const status = {
    baidu: !!window._hmt,
    clarity: !!window.clarity,
    local: getLocalStats()
  }
  console.log('[青付安] 统计加载状态:', status)
  return status
}

// 延迟检查（等第三方脚本加载完）
setTimeout(() => checkTrackerStatus(), 3000)
