<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 持仓卡</span>
      <span class="title">消费证据资料夹</span>
    </div>

    <div class="section-header">
      <span class="section-title">全部资产文件夹</span>
      <span class="btn-add-folder" @click="router.push('/folder-create')">+ 新建资料夹</span>
    </div>

    <div v-if="!folders.length" class="empty-card">
      <span class="empty-text">暂无文件夹</span>
      <span class="empty-hint">点击右上角「+ 新建资料夹」来归集每个资产的合同、付款截图等凭证材料</span>
    </div>

    <div class="folder-card" v-for="f in folders" :key="f.id" @click="selectFolder(f)">
      <span class="folder-name">{{ assetName(f.assetId) }}</span>
      <span class="folder-meta">绑定资产 · 凭证 {{ locked ? "•••" : fileCount(f.id) }} 份</span>
      <div class="folder-actions">
        <div class="btn-export" @click.stop="onExport(f)">导出凭证</div>
        <span class="btn-more" @click.stop="selectFolder(f)">···</span>
      </div>
    </div>

    <template v-if="currentFolder && !locked">
      <div class="checklist-card">
        <span class="checklist-title">材料完整性检查清单</span>
        <span class="checklist-sub">（当前文件夹: {{ assetName(currentFolder.assetId) }}）</span>
        <div class="check-item" v-for="mt in materialTypes" :key="mt.key">
          <span class="check-label">{{ mt.label }}</span>
          <div class="check-status" :class="{ uploaded: isUploaded(mt.key), missing: !isUploaded(mt.key) }">
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
        <div class="btn-cancel" @click="showTypePicker=false">取消</div>
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
        <div class="btn-cancel" @click="showMethodPicker=false">取消</div>
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
        <div class="btn-cancel" @click="showManage=false">关闭</div>
      </div>
    </div>

    <package-loading v-if="showLoading" @done="showLoading=false" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { locked } from '@/store/lock.js'
import { getFolders, getFiles, getAssets, addFile, deleteFile as delFile } from '@/common/storage.js'
import { track } from '@/common/analytics.js'
import PackageLoading from '@/components/package-loading/index.vue'

const router = useRouter()
const showLoading = ref(false)
const showTypePicker = ref(false)
const showMethodPicker = ref(false)
const showManage = ref(false)
const currentFolder = ref(null)
const pickedType = ref(null)

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
const folders = computed(()=>getFolders())
const currentFiles = computed(()=>currentFolder.value?getFiles(currentFolder.value.id):[])
const uploadedCount = computed(()=>materialTypes.filter(mt=>isUploaded(mt.key)).length)
function isUploaded(k) { return currentFiles.value.some(f=>f.materialType===k) }
function assetName(id) { const a=getAssets().find(x=>x.id===id); return a?`${a.storeName} · ${a.scene||''}`:'未知资产' }
function fileCount(id) { return getFiles(id).length }
function navigateBack() {
  if (currentFolder.value?.assetId) {
    router.push(`/asset-detail?id=${currentFolder.value.assetId}`)
  } else {
    router.back()
  }
}
function selectFolder(f) { if (locked.value) return; currentFolder.value=f }

// 导出
function onExport(f) { track('证据夹', '导出单个'); currentFolder.value=f; doExport(f) }
function onExportAll() { track('证据夹', '一键打包'); doExport(currentFolder.value) }

function doExport(folder) {
  if (!folder) return
  showLoading.value=true
  const files=getFiles(folder.id)
  const asset=getAssets().find(a=>a.id===folder.assetId)
  const aname=asset?`${asset.storeName}·${asset.scene||''}`:'未知资产'
  const groups={}
  files.forEach(f=>{ const g=f.materialType||'other'; if(!groups[g])groups[g]=[]; groups[g].push(f) })

  let report=`<html><head><meta charset="utf-8"><title>青付安·${aname}·维权凭证</title><style>body{font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#245957}h1{font-size:20px;color:#48A9A6}h2{font-size:16px;margin-top:24px}.meta{color:#888;font-size:12px}.item{padding:8px;margin:4px 0;background:#B8E6E1;border-radius:6px}img{max-width:100%;border-radius:4px}</style></head><body><h1>青付安 · 维权凭证报告</h1><p class="meta">资产: ${aname} | ${new Date().toLocaleString()}</p>`
  for(const [k,items] of Object.entries(groups)) {
    report+=`<h2>${getMaterialLabel(k)}</h2>`
    items.forEach(f=>{ report+=`<div class="item"><strong>${f.name}</strong> · ${f.size||'--'}`; if(f.dataUrl)report+=`<br><img src="${f.dataUrl}">`; report+='</div>' })
  }
  report+=`<p class="meta" style="margin-top:32px">本报告由青付安App生成，仅供维权参考</p></body></html>`

  const blob=new Blob([report],{type:'text/html;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a'); a.href=url; a.download=`青付安_${aname}_维权凭证_${new Date().toISOString().slice(0,10)}.html`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)

  showLoading.value=false
  window.__toast?.('凭证报告已下载，可在浏览器下载中查看')
}

// 上传
function startUpload() { track('证据夹', '上传凭证'); showTypePicker.value=true }
function onTypePicked(mt) { pickedType.value=mt; showTypePicker.value=false; showMethodPicker.value=true }
function uploadCamera() { showMethodPicker.value=false; pickAndSave('image/*','camera') }
function uploadAlbum()  { showMethodPicker.value=false; pickAndSave('image/*',null) }
function uploadFile()   { showMethodPicker.value=false; pickAndSave('*/*',null) }

function pickAndSave(accept,capture) {
  const inp=document.createElement('input'); inp.type='file'; inp.accept=accept
  if(capture)inp.setAttribute('capture','environment'); inp.multiple=true
  inp.onchange=(e)=>{
    const files=e.target.files; if(!files||!files.length)return
    Array.from(files).forEach(f=>{
      const entry={folderId:currentFolder.value?.id||'',name:f.name,type:f.type||'file',size:f.size>1048576?(f.size/1048576).toFixed(1)+'MB':(f.size/1024).toFixed(1)+'KB',materialType:pickedType.value?.key||'',dataUrl:''}
      if(f.type.startsWith('image/')){ const r=new FileReader(); r.onload=ev=>{ entry.dataUrl=ev.target.result; addFile(entry) }; r.readAsDataURL(f) }
      else addFile(entry)
    })
    setTimeout(()=>{ currentFolder.value={...currentFolder.value} },300)
  }
  document.body.appendChild(inp); inp.click()
  inp.addEventListener('change', () => { setTimeout(() => document.body.removeChild(inp), 100) }, { once: true })
  inp.addEventListener('cancel', () => { document.body.removeChild(inp) }, { once: true })
}

function removeFile(id) { delFile(id); currentFolder.value={...currentFolder.value} }
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
.btn-row{display:flex;gap:8px;margin:14px 16px}
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
.btn-cancel{margin-top:8px;height:44px;background:#fff;border:1px solid #999;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;color:#245957;cursor:pointer}
.manage-item{display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #F0F0F0;gap:8px}
.manage-name{flex:1;font-size:13px;color:#245957;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.manage-type{font-size:10px;color:#48A9A6;padding:1px 6px;background:#B8E6E1;border-radius:4px;white-space:nowrap}
.btn-del-sm{padding:4px 10px;font-size:11px;color:#E8686A;border:1px solid #E8686A;border-radius:4px;cursor:pointer}
.copy-text{background:#B8E6E1;padding:12px;border-radius:8px;font-size:12px;color:#245957;white-space:pre-wrap;max-height:200px;overflow-y:auto;margin:12px 0}
</style>
