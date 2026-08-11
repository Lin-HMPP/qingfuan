// 百度统计 + Clarity 事件埋点工具

let _initialized = false
function initCounter() {
  if (_initialized) return
  _initialized = true
  try {
    const key = 'qf_visit_log'
    const today = new Date().toISOString().slice(0, 10)
    const log = JSON.parse(localStorage.getItem(key) || '{}')
    log[today] = (log[today] || 0) + 1
    const keys = Object.keys(log).sort()
    if (keys.length > 90) keys.slice(0, keys.length - 90).forEach(k => delete log[k])
    localStorage.setItem(key, JSON.stringify(log))
  } catch (e) { /* ignore */ }
}

export function track(category, action, label, value) {
  initCounter() // 延迟初始化，避免模块加载时阻塞
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
  } catch (e) { /* ignore */ }
}

export function getLocalStats() {
  try {
    const log = JSON.parse(localStorage.getItem('qf_visit_log') || '{}')
    const total = Object.values(log).reduce((a, b) => a + b, 0)
    return { total, days: Object.keys(log).length, log }
  } catch (e) { return { total: 0, days: 0, log: {} } }
}
