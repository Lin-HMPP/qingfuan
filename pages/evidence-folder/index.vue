<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 持仓卡</span>
      <span class="title">消费证据资料夹</span>
    </div>

    <!-- 未选中文件夹：显示全部文件夹列表 -->
    <template v-if="!currentFolder || locked">
      <div class="section-header">
        <span class="section-title">全部资产文件夹</span>
        <span class="btn-add-folder" @click="goNewFolder">+ 新建资料夹</span>
      </div>

      <div v-if="!folders.length" class="empty-card">
        <span class="empty-text">暂无文件夹</span>
        <span class="empty-hint">点击右上角「+ 新建资料夹」来归集每个资产的合同、付款截图等凭证材料</span>
      </div>

      <div class="folder-card" v-for="f in folders" :key="f.id">
        <div class="folder-main" @click="selectFolder(f)">
          <span class="folder-name" :class="{ 'unnamed': !f.name }">{{ f.name || '无名资料夹' }}</span>
          <span class="folder-meta">绑定资产 · {{ assetName(f.assetId) }} · 凭证 {{ locked ? "•••" : fileCount(f.id) }} 份</span>
        </div>
        <div class="folder-actions">
          <div class="btn-export" @click.stop="onExport(f)">导出凭证</div>
          <span class="btn-more" @click.stop="toggleMenu(f)">···</span>
        </div>
        <div class="action-menu" v-if="menuFolderId === f.id" @click.stop>
          <div class="action-item" @click="startEdit(f)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px;vertical-align:-3px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            编辑
          </div>
          <div class="action-item danger" @click="confirmDel(f)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px;vertical-align:-3px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除
          </div>
        </div>
      </div>
    </template>

    <!-- 已选中文件夹：显示返回栏 + 高亮卡片 + 详情 -->
    <template v-if="currentFolder && !locked">
      <div class="back-bar" @click="currentFolder = null">
        <span class="back-arrow">‹</span>
        <span>返回全部文件夹</span>
      </div>

      <div class="folder-card selected">
        <div class="folder-main" @click="selectFolder(currentFolder)">
          <span class="folder-name" :class="{ 'unnamed': !currentFolder.name }">{{ currentFolder.name || '无名资料夹' }}</span>
          <span class="folder-meta">绑定资产 · {{ assetName(currentFolder.assetId) }} · 凭证 {{ locked ? "•••" : fileCount(currentFolder.id) }} 份</span>
        </div>
        <div class="folder-actions">
          <div class="btn-export" @click.stop="onExport(currentFolder)">导出凭证</div>
          <span class="btn-more" @click.stop="toggleMenu(currentFolder)">···</span>
        </div>
        <div class="action-menu" v-if="menuFolderId === currentFolder.id" @click.stop>
          <div class="action-item" @click="startEdit(currentFolder)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px;vertical-align:-3px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            编辑
          </div>
          <div class="action-item danger" @click="confirmDel(currentFolder)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px;vertical-align:-3px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除
          </div>
        </div>
      </div>

      <div class="checklist-card">
        <span class="checklist-title">材料完整性检查清单</span>
        <span class="checklist-sub">（当前文件夹: {{ assetName(currentFolder.assetId) }}）</span>
        <div class="check-item" v-for="mt in materialTypes" :key="mt.key">
          <span class="check-label">{{ mt.label }}</span>
          <div class="check-status" :class="{ uploaded: isUploaded(mt.key), missing: !isUploaded(mt.key) }" @click="!isUploaded(mt.key) && quickUpload(mt)">
            {{ isUploaded(mt.key) ? '已上传' : '缺失' }}
          </div>
        </div>
        <span class="check-summary">已上传 {{ uploadedCount }}/{{ materialTypes.length }} 项</span>
      </div>

      <div class="file-list">
        <div class="file-list-header">
          <span class="section-title">当前文件夹素材</span>
          <span class="btn-manage" @click="showManage = true">管理材料</span>
        </div>
        <div class="file-item" v-for="f in currentFiles" :key="f.id">
          <span class="file-name">{{ f.name }}</span>
          <span class="file-type">{{ getMaterialLabel(f.materialType) }}</span>
          <span class="file-size">{{ f.size || '--' }}</span>
        </div>
        <div v-if="!currentFiles.length" class="no-files">暂无文件，请上传凭证材料</div>
      </div>

      <div class="btn-row">
        <div class="btn-primary flex-1" @click="onExportAll">一键打包</div>
        <div class="btn-secondary flex-1" @click="startUpload">+ 新增凭证上传</div>
      </div>
      <span class="privacy-note">所有凭证仅本地存储，不上传服务器</span>
    </template>

    <!-- 材料类型弹窗 -->
    <div v-if="showTypePicker" class="mask" @click="showTypePicker=false">
      <div class="modal" @click.stop>
        <span class="modal-title">选择材料类型</span>
        <div class="type-list">
          <div class="type-item" v-for="mt in materialTypes" :key="mt.key" @click="onTypePicked(mt)">{{ mt.label }}<span class="type-arrow">›</span></div>
        </div>
        <div class="btn-cancel solo" @click="showTypePicker=false">取消</div>
      </div>
    </div>

    <!-- 上传方式弹窗 -->
    <div v-if="showMethodPicker" class="mask" @click="showMethodPicker=false">
      <div class="modal" @click.stop>
        <span class="modal-title">选择上传方式</span>
        <span class="modal-sub">类型: {{ pickedType?.label }}</span>
        <div class="divider" />
        <div class="option" @click="uploadCamera">拍 摄<span class="opt-arrow">›</span></div>
        <div class="option" @click="uploadAlbum">相册选择<span class="opt-arrow">›</span></div>
        <div class="option" @click="uploadFile">文件上传<span class="opt-arrow">›</span></div>
        <div class="btn-cancel solo" @click="showMethodPicker=false">取消</div>
      </div>
    </div>

    <!-- 管理材料弹窗 -->
    <div v-if="showManage" class="mask" @click="showManage=false">
      <div class="modal" @click.stop>
        <span class="modal-title">管理材料</span>
        <div class="manage-item" v-for="f in currentFiles" :key="f.id">
          <span class="manage-name">{{ f.name }}</span>
          <span class="manage-type">{{ getMaterialLabel(f.materialType) }}</span>
          <div class="btn-del-sm" @click="removeFile(f.id)">删除</div>
        </div>
        <div v-if="!currentFiles.length" class="no-files">暂无文件</div>
        <div class="btn-cancel solo" @click="showManage=false">关闭</div>
      </div>
    </div>

    <!-- 编辑资料夹弹窗 -->
    <div v-if="editFolder" class="mask" @click="editFolder=null;menuFolderId=null">
      <div class="modal" @click.stop>
        <span class="modal-title">编辑资料夹</span>
        <span class="label">文件夹名称</span>
        <input class="input-blue" v-model="editForm.name" placeholder="输入文件夹名称" maxlength="30" />
        <span class="label">绑定资产</span>
        <div class="select-wrap">
          <select v-model="editForm.assetId" class="select-box">
            <option v-for="a in assetOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
          </select>
          <span class="arrow-down">▼</span>
        </div>
        <div class="btn-row">
          <div class="btn-cancel flex-1" @click="editFolder=null;menuFolderId=null">取消</div>
          <div class="btn-primary flex-1" @click="saveEdit">保存</div>
        </div>
      </div>
    </div>

    <package-loading v-if="showLoading" @done="showLoading=false" />

    <!-- 图片编辑器（打码/裁剪） -->
    <image-editor v-if="editingImage" :src="editingImage" @done="onEditDone" @cancel="editingImage = null" />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { locked } from '@/store/lock.js'
import { getFolders, getFiles, getAssets, addFile, deleteFile as delFile, updateFolder, deleteFolder } from '@/common/storage.js'
import { track } from '@/common/analytics.js'
import PackageLoading from '@/components/package-loading/index.vue'
import ImageEditor from '@/components/image-editor/index.vue'

const router = useRouter()
const route = useRoute()
const $toast = (msg) => window.__toast?.(msg)
function guard() { if (locked.value) { $toast('信息已锁定，请先解锁'); return false } return true }
const showLoading = ref(false)
const showTypePicker = ref(false)
const showMethodPicker = ref(false)
const showManage = ref(false)
const currentFolder = ref(null)
const pickedType = ref(null)
const menuFolderId = ref(null)    // 当前展开操作菜单的文件夹ID
const editFolder = ref(null)      // 正在编辑的文件夹对象
const editForm = ref({ name: '', assetId: '' })
const folderRefresh = ref(0)
const editingImage = ref(null)    // 正在编辑的图片 dataUrl
const editingEntry = ref(null)    // 编辑中的文件对象

// 如果 URL 带了 assetId，自动选中该资产的文件夹
onMounted(() => {
  const assetId = route.query.assetId
  if (assetId) {
    const folders = getFolders()
    const match = folders.find(f => f.assetId === assetId)
    if (match) currentFolder.value = match
  }
})

const materialTypes = [
  { key: 'contract',     label: '① 交易依据 - 合同协议' },
  { key: 'payment',      label: '① 交易依据 - 付款截图' },
  { key: 'poster',       label: '② 宣传承诺 - 活动海报' },
  { key: 'chat',         label: '② 宣传承诺 - 销售聊天记录' },
  { key: 'writeoff',     label: '③ 履约记录 - 核销打卡记录' },
  { key: 'notice',       label: '④ 问题记录 - 迁店/停业通知' },
  { key: 'refund_chat',  label: '④ 问题记录 - 退费沟通记录' },
  { key: 'negotiation',  label: '⑤ 用户诉求 - 退款转卡协商材料' },
]

function getMaterialLabel(key) { return materialTypes.find(m=>m.key===key)?.label||key }
const folders = computed(()=>{ void folderRefresh.value; return getFolders() })
const currentFiles = computed(()=>currentFolder.value?getFiles(currentFolder.value.id):[])
const uploadedCount = computed(()=>materialTypes.filter(mt=>isUploaded(mt.key)).length)
function isUploaded(k) { return currentFiles.value.some(f=>f.materialType===k) }
function assetName(id) { const a=getAssets().find(x=>x.id===id); return a?`${a.storeName} · ${a.scene||''}`:'未知资产' }
function fileCount(id) { return getFiles(id).length }
function navigateBack() {
  if (currentFolder.value?.assetId) {
    router.push(`/asset-detail?id=${currentFolder.value.assetId}`)
  } else {
    router.push('/asset-list')
  }
}
function goNewFolder() { if (!guard()) return; router.push('/folder-create') }
function selectFolder(f) { if (!guard()) return; menuFolderId.value=null; currentFolder.value=f }

// 资料夹操作菜单
function toggleMenu(f) { menuFolderId.value = menuFolderId.value === f.id ? null : f.id }

const assetOptions = computed(() => {
  try {
    if (locked.value) return []
    return getAssets().map(a => ({
      label: `${a.storeName} · ${a.scene || ''} (¥${(a.totalPrice||0).toLocaleString()})`,
      value: a.id
    }))
  } catch (e) { return [] }
})

function startEdit(f) {
  menuFolderId.value = null
  editForm.value = { name: f.name || '', assetId: f.assetId || '' }
  editFolder.value = f
}
function saveEdit() {
  const f = editFolder.value
  if (!f) return
  if (!editForm.value.assetId) { window.__toast?.('请选择绑定的资产'); return }
  const cleanName = stripEmoji(editForm.value.name.trim()) || '凭证资料夹'
  updateFolder(f.id, { name: cleanName, assetId: editForm.value.assetId })
  window.__toast?.('资料夹已更新')
  editFolder.value = null
  menuFolderId.value = null
  folderRefresh.value++
  // 如果当前选中的文件夹被编辑，刷新引用
  if (currentFolder.value?.id === f.id) {
    currentFolder.value = { ...currentFolder.value, name: editForm.value.name.trim(), assetId: editForm.value.assetId }
  }
}
function confirmDel(f) {
  menuFolderId.value = null
  if (window.confirm(`确定删除「${f.name || '无名资料夹'}」？\n\n删除后，该资料夹内的所有凭证文件也将一并清除，不可恢复。`)) {
    // 取消选中（如果当前选中的是要删除的文件夹）
    if (currentFolder.value?.id === f.id) currentFolder.value = null
    deleteFolder(f.id)
    folderRefresh.value++
    window.__toast?.('资料夹已删除')
  }
}

// 导出
function onExport(f) { track('证据夹', '导出单个'); currentFolder.value=f; doExport(f) }
function onExportAll() { track('证据夹', '一键打包'); doExport(currentFolder.value) }

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function doExport(folder) {
  if (!folder) return
  showLoading.value=true
  // 延迟执行打包，让 loading 动画先渲染
  setTimeout(() => {
    try {
      const files=getFiles(folder.id)
      const asset=getAssets().find(a=>a.id===folder.assetId)
      const aname=escapeHtml(asset?`${asset.storeName}·${asset.scene||''}`:'未知资产')
      const groups={}
      files.forEach(f=>{ const g=f.materialType||'other'; if(!groups[g])groups[g]=[]; groups[g].push(f) })

      let report=`<html><head><meta charset="utf-8"><title>青付安·${aname}·维权凭证</title><style>body{font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#245957}h1{font-size:20px;color:#48A9A6}h2{font-size:16px;margin-top:24px}.meta{color:#888;font-size:12px}.item{padding:8px;margin:4px 0;background:#B8E6E1;border-radius:6px}img{max-width:100%;border-radius:4px}</style></head><body><h1>青付安 · 维权凭证报告</h1><p class="meta">资产: ${aname} | ${new Date().toLocaleString()}</p>`
      for(const [k,items] of Object.entries(groups)) {
        report+=`<h2>${escapeHtml(getMaterialLabel(k))}</h2>`
        items.forEach(f=>{
            report+=`<div class="item"><strong>${escapeHtml(f.name)}</strong> · ${escapeHtml(f.size||'--')}`
            if(f.dataUrl){
              const isImg = (f.mimeType||'').startsWith('image/') || f.type === 'image'
              if(isImg){
                report+=`<br><img src="${f.dataUrl}" style="max-width:100%;border-radius:4px">`
              } else {
                report+=`<br><a href="${f.dataUrl}" download="${escapeHtml(f.name)}" style="display:inline-block;margin-top:6px;padding:6px 14px;background:#48A9A6;color:#fff;border-radius:6px;text-decoration:none;font-size:12px">&#8595; 下载文件</a>`
              }
            }
            report+='</div>'
          })
      }
      report+=`<p class="meta" style="margin-top:32px">本报告由青付安App生成，仅供维权参考</p></body></html>`

      const blob=new Blob([report],{type:'text/html;charset=utf-8'})
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a'); a.href=url; a.download=`青付安_${aname}_维权凭证_${new Date().toISOString().slice(0,10)}.html`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)

      showLoading.value=false
      window.__toast?.('凭证报告已下载。如在微信中图片无法显示，请用浏览器打开查看')
    } catch (e) {
      showLoading.value=false
      window.__toast?.('导出失败，请重试')
      console.error('证据导出失败:', e)
    }
  }, 200)
}

// 图片编辑完成
function onEditDone(dataUrl) {
  if (editingEntry.value) {
    editingEntry.value.dataUrl = dataUrl
    addFile(editingEntry.value)
  }
  editingImage.value = null
  editingEntry.value = null
}

// 上传
function startUpload() { track('证据夹', '上传凭证'); showTypePicker.value=true }
function quickUpload(mt) {
  // 点击缺失标签 → 直接跳过类型选择，进入上传方式弹窗
  pickedType.value = mt
  showMethodPicker.value = true
}
function onTypePicked(mt) { pickedType.value=mt; showTypePicker.value=false; showMethodPicker.value=true }
function uploadCamera() { showMethodPicker.value=false; pickAndSave('image/*','camera') }
function uploadAlbum()  { showMethodPicker.value=false; pickAndSave('image/*',null) }
function uploadFile()   { showMethodPicker.value=false; pickAndSave('*/*',null) }

function pickAndSave(accept,capture) {
  const inp=document.createElement('input'); inp.type='file'; inp.accept=accept
  if(capture)inp.setAttribute('capture','environment'); inp.multiple=true

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    window.removeEventListener('focus', onFocusCancel)
    if (inp.parentNode) document.body.removeChild(inp)
  }

  let pendingCount = 0
  inp.onchange=(e)=>{
    const files=e.target.files; if(!files||!files.length){ cleanup(); return }
    pendingCount = files.length
    Array.from(files).forEach(f=>{
      const entry={folderId:currentFolder.value?.id||'',name:f.name,type:f.type.startsWith('image/')?'image':(f.name.split('.').pop()||'file'),size:f.size>1048576?(f.size/1048576).toFixed(1)+'MB':(f.size/1024).toFixed(1)+'KB',materialType:pickedType.value?.key||'',dataUrl:'',mimeType:f.type||'application/octet-stream'}
      const isImage = f.type.startsWith('image/')
      const r=new FileReader()
      r.onload=ev=>{ entry.dataUrl=ev.target.result; addFile(entry); pendingCount--; if(pendingCount<=0)currentFolder.value={...currentFolder.value} }
      r.onerror=()=>{ addFile(entry); pendingCount-- }
      r.readAsDataURL(f)
    })
    cleanup()
  }
  inp.addEventListener('cancel', cleanup)
  const onFocusCancel = () => {
    setTimeout(() => {
      if (!cleaned && inp.parentNode) document.body.removeChild(inp)
      window.removeEventListener('focus', onFocusCancel)
    }, 500)
  }
  window.addEventListener('focus', onFocusCancel)
  document.body.appendChild(inp); inp.click()
}

// 过滤 emoji，防止导出乱码
function stripEmoji(s) { return (s || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim() }
function removeFile(id, silent) { delFile(id); currentFolder.value={...currentFolder.value}; if (!silent) window.__toast?.('已删除') }
function removeFiles(ids) { ids.forEach(id => delFile(id)); currentFolder.value={...currentFolder.value}; window.__toast?.(`已删除 ${ids.length} 个文件`); }
</script>

<style scoped>
.page{min-height:100vh;background:#FFFFFF;padding-bottom:80px}
.nav-bar{display:flex;align-items:center;height:44px;background:#fff;padding:0 16px;border-bottom:1px solid #48A9A6}
.back{font-size:15px;color:#48A9A6;cursor:pointer}
.title{position:absolute;left:50%;transform:translateX(-50%);font-size:18px;font-weight:bold;color:#245957}
.section-header{display:flex;justify-content:space-between;align-items:center;margin:12px 16px 8px}
.section-title{font-size:15px;font-weight:bold}
.btn-add-folder{font-size:12px;color:#48A9A6;font-weight:bold;cursor:pointer;padding:4px 12px;border:1.5px solid #48A9A6;border-radius:14px;transition:transform .1s ease,background .1s ease}
.btn-add-folder:active{transform:scale(.96);background:#B8E6E1}
.empty-card{margin:40px 16px;text-align:center;padding:32px 16px;border:1px dashed #48A9A6;border-radius:12px;display:flex;flex-direction:column;align-items:center}
.empty-text{font-size:16px;color:#245957;display:block;margin-bottom:8px}
.empty-hint{font-size:12px;color:#638F8D;display:block;max-width:260px;line-height:1.6}
.folder-card{margin:8px 16px;padding:14px;background:#fff;border:1px solid #48A9A6;border-radius:12px;position:relative;cursor:pointer}
.folder-name{font-size:15px;font-weight:bold;display:block}
.folder-meta{font-size:12px;color:#888}
.folder-actions{position:absolute;right:14px;top:14px;display:flex;gap:8px;align-items:center}
.btn-export{padding:4px 10px;background:#48A9A6;color:#fff;font-size:10px;font-weight:bold;border-radius:8px;cursor:pointer}
.btn-more{font-size:16px;color:#48A9A6;cursor:pointer}
.checklist-card{margin:12px 16px;padding:14px;background:#fff;border:1px solid #48A9A6;border-radius:12px}
.checklist-title{font-size:15px;font-weight:bold;display:block}
.checklist-sub{font-size:12px;color:#888;margin-bottom:10px;display:block}
.check-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0}
.check-label{font-size:12px;color:#245957}
.check-status{font-size:10px;padding:2px 8px;border-radius:10px;white-space:nowrap}
.check-status.uploaded{background:#48A9A6;color:#fff}
.check-status.missing{border:1px solid #48A9A6;color:#48A9A6;background:#fff}
.check-summary{font-size:10px;color:#888;margin-top:8px;display:block}
.file-list{margin:12px 16px}
.file-list-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.btn-manage{font-size:12px;color:#48A9A6;font-weight:bold;cursor:pointer}
.file-item{padding:8px 12px;margin:4px 0;background:#B8E6E1;border:1px solid #48A9A6;border-radius:6px;display:flex;align-items:center;gap:8px}
.file-name{flex:1;font-size:12px;color:#245957;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-type{font-size:10px;color:#48A9A6;padding:1px 6px;background:#B8E6E1;border-radius:4px;white-space:nowrap}
.file-size{font-size:10px;color:#888;white-space:nowrap}
.no-files{text-align:center;padding:20px;font-size:13px;color:#638F8D}
.btn-row{display:flex;gap:10px;margin:14px 16px}
.flex-1{flex:1}
.btn-primary,.btn-secondary{height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:15px;font-weight:bold;cursor:pointer}
.btn-primary{background:#48A9A6;color:#fff;border:none}
.btn-secondary{background:#fff;color:#48A9A6;border:1px solid #48A9A6}
.privacy-note{display:block;text-align:center;font-size:10px;color:#888;padding:0 16px 16px}
.mask{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}
.modal{width:343px;background:#fff;border:1px solid #48A9A6;border-radius:16px;padding:20px 24px 24px;box-shadow:0 4px 16px rgba(0,0,0,.15);max-height:80vh;overflow-y:auto}
.modal-title{display:block;text-align:center;font-size:18px;font-weight:bold;color:#245957;margin-bottom:4px}
.modal-sub{display:block;text-align:center;font-size:12px;color:#48A9A6;margin-top:4px}
.divider{height:1px;background:#B8E6E1;margin:14px 0}
.type-list{max-height:360px;overflow-y:auto}
.type-item{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #F0F0F0;cursor:pointer}
.type-arrow{font-size:16px;color:#638F8D}
.option{display:flex;align-items:center;height:48px;background:#B8E6E1;border:1px solid #48A9A6;border-radius:8px;padding:0 16px;margin:6px 0;cursor:pointer;font-size:15px;color:#245957}
.opt-arrow{font-size:18px;color:#48A9A6;margin-left:auto}
.btn-cancel{height:44px;background:#fff;border:1px solid #999;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;color:#245957;cursor:pointer}
.btn-cancel.solo{margin-top:8px}
.manage-item{display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #F0F0F0;gap:8px}
.manage-name{flex:1;font-size:13px;color:#245957;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.manage-type{font-size:10px;color:#48A9A6;padding:1px 6px;background:#B8E6E1;border-radius:4px;white-space:nowrap}
.btn-del-sm{padding:4px 10px;font-size:11px;color:#E8686A;border:1px solid #E8686A;border-radius:4px;cursor:pointer}
.copy-text{background:#B8E6E1;padding:12px;border-radius:8px;font-size:12px;color:#245957;white-space:pre-wrap;max-height:200px;overflow-y:auto;margin:12px 0}

/* 资料夹卡片布局 */
.folder-card { position: relative; transition: all .2s ease; }
.folder-card.selected {
  background: #F5FAFA; border-color: #48A9A6; border-width: 2px;
  box-shadow: 0 0 0 3px rgba(72,169,166,.12);
}
.folder-card.selected::before {
  content: ''; position: absolute; left: 0; top: 12px; bottom: 12px;
  width: 3px; background: #48A9A6; border-radius: 0 2px 2px 0;
}
.folder-card:not(.selected) {
  opacity: .55;
}
.folder-main { cursor: pointer; }
.folder-name.unnamed { color: #AAA; font-style: italic; }

/* 返回全部文件夹栏 */
.back-bar {
  display: flex; align-items: center; gap: 6px;
  margin: 8px 16px; padding: 10px 14px;
  background: #F5FAFA; border: 1px solid #48A9A6; border-radius: 8px;
  font-size: 13px; color: #48A9A6; font-weight: bold; cursor: pointer;
}
.back-arrow { font-size: 20px; line-height: 1; }

/* 滑动操作菜单 */
.action-menu {
  display: flex; gap: 0;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px dashed #B8E6E1;
  animation: slideDown .2s ease;
}
@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 60px; } }
.action-item {
  flex: 1; text-align: center; padding: 8px 0;
  font-size: 13px; font-weight: bold; color: #245957;
  border-radius: 6px; cursor: pointer;
}
.action-item:active { background: #B8E6E1; }
.action-item.danger { color: #E8686A; }

/* 编辑弹窗 */
.label { display: block; font-size: 14px; font-weight: bold; color: #245957; margin: 12px 0 4px; }
.input-blue { width: 100%; height: 44px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 0 12px; font-size: 15px; color: #245957; outline: none; box-sizing: border-box; }
.select-wrap { position: relative; }
.select-box { width: 100%; height: 44px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 0 36px 0 12px; font-size: 15px; color: #245957; appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; }
.arrow-down { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #48A9A6; pointer-events: none; }
</style>
