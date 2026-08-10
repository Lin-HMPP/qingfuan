/**
 * 青付安 — 表单校验工具
 * 全局统一校验规则
 */

/** 手机号校验 (11位中国大陆手机号) */
export function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

/** 验证码校验 (6位数字) */
export function isValidCode(code) {
  return /^\d{6}$/.test(code)
}

/** 正整数校验 */
export function isPositiveInt(val) {
  const n = parseInt(val)
  return !isNaN(n) && n > 0 && n.toString() === val.toString()
}

/** 正数校验（含小数） */
export function isPositiveNumber(val) {
  const n = parseFloat(val)
  return !isNaN(n) && n > 0
}

/** 文件夹名称校验 (2-30字符，不含特殊符号) */
export function isValidFolderName(name) {
  if (!name || name.length < 2 || name.length > 30) return false
  return !/[<>:"/\\|?*]/.test(name)
}

/** 场景名称校验 (1-20字符) */
export function isValidSceneName(name) {
  return name && name.trim().length >= 1 && name.trim().length <= 20
}

/** 金额校验 (正数，最多2位小数) */
export function isValidAmount(val) {
  const n = parseFloat(val)
  return !isNaN(n) && n > 0 && /^\d+(\.\d{0,2})?$/.test(val)
}

/** 核销课时校验 (正整数，不超过剩余课时) */
export function isValidWriteOffHours(val, remainingHours) {
  const n = parseInt(val)
  return !isNaN(n) && n > 0 && n <= remainingHours
}

