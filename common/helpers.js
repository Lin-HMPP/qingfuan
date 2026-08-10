// 浏览器兼容层 — 替代 uni.showModal / uni.showToast
export function showModal(title, content) {
  return new Promise((resolve) => {
    const ok = window.confirm(`${title}\n\n${content}`)
    resolve({ confirm: ok, cancel: !ok })
  })
}

export function showToast(msg) {
  window.__toast?.(msg)
}
