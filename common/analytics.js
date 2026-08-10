// 百度统计 + Clarity 事件埋点工具
// 所有调用已内置 try-catch，绝不会因统计代码报错影响正常功能
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
