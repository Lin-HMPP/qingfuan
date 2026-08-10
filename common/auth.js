/**
 * 青付安 — 本地身份验证（PIN码）
 * 使用 SHA-256 哈希存储，数据仅本机
 */

/** 简单哈希（用于本地PIN验证，非加密用途） */
async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode('qf_' + pin + '_salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** 检查是否已设置 PIN */
export function hasPinSet() {
  return !!localStorage.getItem('qf_pin_hash')
}

/** 设置新 PIN（4-6位数字），设置后自动解锁当前会话 */
export async function setPin(pin) {
  if (!/^\d{4,6}$/.test(pin)) return false
  const hash = await hashPin(pin)
  localStorage.setItem('qf_pin_hash', hash)
  return true
}

/** 验证 PIN */
export async function verifyPin(pin) {
  const stored = localStorage.getItem('qf_pin_hash')
  if (!stored) return true // 未设置PIN，直接通过
  const hash = await hashPin(pin)
  const match = hash === stored
  if (match) localStorage.setItem('qf_unlocked', '1')
  return match
}

/** 修改 PIN */
export async function changePin(oldPin, newPin) {
  if (!await verifyPin(oldPin)) return false
  return await setPin(newPin)
}

/** 锁定应用 */
export function lockApp() {
  localStorage.removeItem('qf_unlocked')
}

/** 是否已解锁 */
export function isUnlocked() {
  return localStorage.getItem('qf_unlocked') === '1'
}
