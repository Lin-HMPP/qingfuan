// 百度统计事件埋点工具
// 用法：track('套餐录入', '确认录入', '健身/舞蹈')
export function track(category, action, label, value) {
  if (window._hmt) {
    const args = ['_trackEvent', category, action]
    if (label !== undefined) args.push(label)
    if (value !== undefined) args.push(String(value))
    window._hmt.push(args)
  }
}
