/**
 * 青付安 — 本地存储引擎 (Vue 3 / localStorage)
 * 对应 PRD §5.1 本地存储全部数据清单
 */
function get(key, fallback = null) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback }
  catch (e) { return fallback }
}
function set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true }
  catch (e) { return false }
}
function remove(key) {
  try { localStorage.removeItem(key); return true }
  catch (e) { return false }
}

const KEYS = {
  ACCOUNT: 'qf_account', ASSETS: 'qf_assets', WRITEOFFS: 'qf_writeoffs',
  PAUSES: 'qf_pauses', FOLDERS: 'qf_folders', FILES: 'qf_files',
  DRAFT: 'qf_draft', DRAFT_TIME: 'qf_draft_time', LOGS: 'qf_logs'
}

export function getAccount() { return get(KEYS.ACCOUNT, { phone: '', token: '', loggedIn: false, loginTime: 0 }) }
export function saveAccount(data) { return set(KEYS.ACCOUNT, data) }
export function clearAccount() { return remove(KEYS.ACCOUNT) }

export function getAssets() { return get(KEYS.ASSETS, []) }
export function saveAssets(assets) { return set(KEYS.ASSETS, assets) }
export function getAssetById(id) { return getAssets().find(a => a.id === id) || null }
export function addAsset(asset) {
  const assets = getAssets()
  asset.id = 'ast_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)
  asset.createdAt = new Date().toISOString()
  assets.unshift(asset); saveAssets(assets)
  return asset
}
export function updateAsset(id, patch) {
  const assets = getAssets(); const idx = assets.findIndex(a => a.id === id)
  if (idx === -1) return null
  assets[idx] = { ...assets[idx], ...patch, updatedAt: new Date().toISOString() }; saveAssets(assets)
  return assets[idx]
}
export function deleteAsset(id) { saveAssets(getAssets().filter(a => a.id !== id)); return true }

export function getWriteOffs(assetId) {
  const all = get(KEYS.WRITEOFFS, [])
  return assetId ? all.filter(w => w.assetId === assetId) : all
}
export function addWriteOff(record) {
  const all = get(KEYS.WRITEOFFS, [])
  record.id = 'wo_' + Date.now(); record.createdAt = new Date().toISOString()
  all.unshift(record); set(KEYS.WRITEOFFS, all); return record
}
export function updateWriteOff(id, patch) {
  const all = get(KEYS.WRITEOFFS, []); const idx = all.findIndex(w => w.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }; set(KEYS.WRITEOFFS, all)
  return all[idx]
}
export function deleteWriteOff(id) { set(KEYS.WRITEOFFS, get(KEYS.WRITEOFFS, []).filter(w => w.id !== id)); return true }

export function getPauses(assetId) {
  const all = get(KEYS.PAUSES, [])
  return assetId ? all.filter(p => p.assetId === assetId) : all
}
export function addPause(record) {
  const all = get(KEYS.PAUSES, [])
  record.id = 'pau_' + Date.now(); record.createdAt = new Date().toISOString()
  all.unshift(record); set(KEYS.PAUSES, all); return record
}

export function getFolders() { return get(KEYS.FOLDERS, []) }
export function addFolder(folder) {
  const folders = get(KEYS.FOLDERS, [])
  folder.id = 'fld_' + Date.now(); folder.createdAt = new Date().toISOString()
  folders.unshift(folder); set(KEYS.FOLDERS, folders); return folder
}
export function updateFolder(id, patch) {
  const folders = get(KEYS.FOLDERS, []); const idx = folders.findIndex(f => f.id === id)
  if (idx === -1) return null
  folders[idx] = { ...folders[idx], ...patch, updatedAt: new Date().toISOString() }; set(KEYS.FOLDERS, folders)
  return folders[idx]
}
export function deleteFolder(id) {
  // 同时删除该文件夹下的所有文件
  const files = get(KEYS.FILES, []).filter(f => f.folderId === id)
  files.forEach(f => deleteFile(f.id))
  set(KEYS.FOLDERS, get(KEYS.FOLDERS, []).filter(f => f.id !== id)); return true
}

// 材料类型映射：materialLabel → materialType key（供套餐录入同步到证据夹使用）
export const MATERIAL_LABEL_MAP = {
  '合同协议': 'contract',
  '付款截图': 'payment',
  '活动海报': 'poster',
  '销售聊天记录': 'chat',
  '核销打卡记录': 'writeoff',
  '迁店/停业通知': 'notice',
  '退费沟通记录': 'refund_chat',
  '退款转卡协商材料': 'negotiation',
}

export function getFiles(folderId) {
  const all = get(KEYS.FILES, [])
  return folderId ? all.filter(f => f.folderId === folderId) : all
}
export function addFile(file) {
  const all = get(KEYS.FILES, [])
  file.id = 'fil_' + Date.now(); file.uploadedAt = new Date().toISOString()
  all.unshift(file); set(KEYS.FILES, all); return file
}
export function deleteFile(id) { set(KEYS.FILES, get(KEYS.FILES, []).filter(f => f.id !== id)); return true }

export function getDraft() {
  const draft = get(KEYS.DRAFT, null); const time = get(KEYS.DRAFT_TIME, 0)
  if (draft && time && Date.now() - time > 7 * 24 * 3600 * 1000) { remove(KEYS.DRAFT); remove(KEYS.DRAFT_TIME); return null }
  return draft
}
export function saveDraft(data) { set(KEYS.DRAFT, data); set(KEYS.DRAFT_TIME, Date.now()); return true }
export function clearDraft() { remove(KEYS.DRAFT); remove(KEYS.DRAFT_TIME); return true }

export { KEYS, get, set, remove }
