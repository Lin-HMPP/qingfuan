// 终端提醒：PWA 角标 + 本地通知 + 日历导出
import { getAssets } from '@/common/storage.js'

// ── 获取即将到期资产 ──
export function getExpiringAssets(days = 30) {
  try {
    const now = Date.now()
    return getAssets().filter(a => {
      if (a.status !== 'active') return false
      const created = new Date(a.createdAt).getTime()
      const validityMs = (a.validityMonths || 12) * 30 * 86400000
      const expiry = created + validityMs
      const remaining = (expiry - now) / 86400000
      return remaining > 0 && remaining <= days
    })
  } catch (e) { return [] }
}

// ── PWA 桌面角标 ──
export function updateBadge() {
  try {
    if (navigator.setAppBadge) {
      const count = getExpiringAssets(30).length
      if (count > 0) {
        navigator.setAppBadge(count)
      } else {
        navigator.clearAppBadge()
      }
    }
  } catch (e) { /* ignore */ }
}

// ── 本地通知（打开网页时检查） ──
export function checkNotify() {
  try {
    if (!('Notification' in window)) return
    if (Notification.permission === 'denied') return

    const urgent = getExpiringAssets(7)  // 7 天内到期
    if (!urgent.length) return

    const names = urgent.slice(0, 2).map(a => a.storeName).join('、')
    const more = urgent.length > 2 ? `等${urgent.length}张卡` : ''

    const show = () => {
      new Notification('青付安 · 即将到期提醒', {
        body: `${names}${more}将在7天内到期，点击查看详情`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2348A9A6"/><text x="50" y="68" text-anchor="middle" fill="white" font-size="56" font-family="sans-serif" font-weight="bold">!</text></svg>',
        tag: 'qingfuan-expiry',
        requireInteraction: true,
      })
      // 点击通知打开网页
      setTimeout(() => {
        const n = show
        n.onclick = () => { window.focus(); n.close() }
      }, 0)
    }

    if (Notification.permission === 'granted') {
      show()
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => { if (p === 'granted') show() })
    }
  } catch (e) { /* ignore */ }
}

// ── 生成日历 ICS 文件 ──
function pad(n) { return String(n).padStart(2, '0') }
function icsDate(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T090000`
}

export function generateCalendar() {
  const assets = getAssets().filter(a => a.status === 'active' && !a.noExpiry)
  if (!assets.length) return null

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//青付安//预付消费到期日历//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:青付安 · 预付卡到期日历',
  ]

  assets.forEach(a => {
    const created = new Date(a.createdAt).getTime()
    const validityMs = (a.validityMonths || 12) * 30 * 86400000
    const expiry = created + validityMs
    const name = `${a.storeName} · ${a.scene || ''}`
    const remain = Math.round((expiry - Date.now()) / 86400000)

    // 到期日前 7 天、3 天、当天各加一个提醒
    const uid = a.id.replace(/[^a-z0-9]/gi, '')
    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}@qingfuan`,
      `DTSTART;VALUE=DATE:${icsDate(expiry).slice(0, 8)}`,
      `DTEND;VALUE=DATE:${icsDate(expiry + 86400000).slice(0, 8)}`,
      `SUMMARY:🔔 ${name} 到期（剩余${remain}天）`,
      `DESCRIPTION:预付卡到期提醒\\n门店：${a.storeName}\\n场景：${a.scene || '--'}\\n剩余价值：¥${((a.totalPrice||0) * (1 - (a.usedTimes||0) / Math.max((a.totalTimes||1), 1))).toFixed(0)}\\n\\n由青付安自动生成`,
      'BEGIN:VALARM',
      'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${name} 3天后到期`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${name} 7天后到期`,
      'END:VALARM',
      'END:VEVENT'
    )
  })

  ics.push('END:VCALENDAR')
  return ics.join('\r\n')
}

export function downloadCalendar() {
  const ics = generateCalendar()
  if (!ics) return false
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '青付安_到期日历.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return true
}
