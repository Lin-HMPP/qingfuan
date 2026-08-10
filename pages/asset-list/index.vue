<!--
  青付安 — 我的预付资产列表 /asset-list
  对应 PRD §4.5 · 线框图 💳 我的预付资产-美化版
-->
<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 首页</span>
      <span class="title">我的预付资产</span>
    </div>

    <!-- 总额统计 -->
    <div class="card-blue stats-bar">
      <span class="stats-amount">{{ locked ? '•••' : totalAmount.toLocaleString() }} 元</span>
      <span class="stats-label">预付总资产</span>
      <span class="stats-info">在库储值卡 {{ locked ? '•••' : assets.length }} 张 ｜ 即将到期 {{ locked ? '•••' : expiringCount }} 张</span>
    </div>

    <!-- 管理资产切换 -->
    <div class="manage-bar" v-if="assets.length && !locked">
      <div class="btn-manage" :class="{ active: manageMode }" @click="manageMode = !manageMode">
        {{ manageMode ? '完成' : '⚙ 管理资产' }}
      </div>
    </div>

    <!-- 空态 -->
    <div v-if="!assets.length" class="empty-card">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round" opacity="0.5"><rect x="8" y="14" width="32" height="24" rx="3"/><line x1="8" y1="22" x2="40" y2="22"/><line x1="24" y1="22" x2="24" y2="38"/><line x1="16" y1="28" x2="20" y2="28"/></svg>
      <span class="empty-text">暂无预付资产记录</span>
      <span class="empty-hint">录入第一张预付卡，开始管理你的消费权益</span>
    </div>

    <!-- 资产卡片列表 -->
    <div v-for="asset in assets" :key="asset.id"
      class="card-blue asset-card" :class="{ 'manage-mode': manageMode }"
      @click="manageMode ? startEdit(asset) : goDetail(asset)">
      <div class="asset-bar" />
      <div class="asset-info">
        <span class="asset-name">{{ asset.storeName }} · {{ asset.scene }}</span>
        <span class="asset-status" v-if="isExpiring(asset)">即将到期</span>
        <span class="asset-meta" v-if="!asset.unlimited">剩余 {{ asset.totalTimes - asset.usedTimes }}/{{ asset.totalTimes }}次 ｜ 到期 {{ remainingDays(asset) }}天</span>
        <span class="asset-meta" v-else>已到店 {{ asset.usedTimes || 0 }} 次 ｜ 到期 {{ remainingDays(asset) }}天</span>
        <span class="asset-unit" v-if="!asset.unlimited">单次 ¥{{ locked ? '•••' : unitCost(asset) }}</span>
        <span class="asset-unit" v-else>{{ locked ? '•••' : '充卡 · 不限次数' }}</span>
      </div>
      <div class="asset-actions" v-if="!manageMode">
        <div class="btn-writeoff" @click.stop="goWriteOff(asset)">核销</div>
        <div class="btn-voucher" @click.stop="goEvidence(asset)">凭证</div>
      </div>
      <div class="asset-actions-manage" v-else @click.stop>
        <div class="btn-edit" @click="startEdit(asset)">✎</div>
        <div class="btn-del" @click="confirmDelete(asset)">✕</div>
      </div>
    </div>

    <!-- 新增按钮 -->
    <div class="btn-add" @click="goAdd">+ 新增预付卡</div>

    <!-- 编辑弹窗 -->
    <div v-if="editing" class="mask" @click="editing = null">
      <div class="edit-modal" @click.stop>
        <span class="modal-title">编辑资产</span>
        <span class="label">门店名称</span>
        <input class="input-blue" v-model="editForm.storeName" />
        <span class="label">消费场景</span>
        <input class="input-blue" v-model="editForm.scene" />
        <span class="label">预付总价（元）</span>
        <input class="input-blue" v-model="editForm.totalPrice" type="number" />
        <span class="label">总次数</span>
        <input class="input-blue" v-model="editForm.totalTimes" type="number" />
        <span class="label">有效期（月）</span>
        <input class="input-blue" v-model="editForm.validityMonths" type="number" />
        <div class="btn-row">
          <div class="btn-secondary flex-1" @click="editing = null">取消</div>
          <div class="btn-primary flex-1" @click="saveEdit">保存</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, reactive, computed } from 'vue'
import { locked } from '@/store/lock.js'
import { getAssets, updateAsset, deleteAsset, getWriteOffs, getFolders, getFiles, getPauses } from '@/common/storage.js'
import { deleteWriteOff, deleteFolder, deleteFile, KEYS, set } from '@/common/storage.js'

const router = useRouter()
const $toast = (msg) => window.__toast?.(msg)
function guard() { if (locked.value) { $toast('信息已锁定，请先解锁'); return false } return true }
// 使用 refreshKey 强制 computed 重新读取 localStorage
const refreshKey = ref(0)
const assets = computed(() => { void refreshKey.value; return getAssets() })

// 管理模式
const manageMode = ref(false)
const editing = ref(null)
const editForm = reactive({ storeName: '', scene: '', totalPrice: '', totalTimes: '', validityMonths: '' })
const totalAmount = computed(() => assets.value.reduce((s, a) => s + (a.totalPrice || 0), 0))
const expiringCount = computed(() => assets.value.filter(a => isExpiring(a)).length)

function remainingDays(a) {
  const end = new Date(a.createdAt)
  end.setMonth(end.getMonth() + (a.validityMonths || 12))
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
}
function isExpiring(a) { const d = remainingDays(a); return d <= 30 && d > 0 }
function unitCost(a) { return a.totalTimes ? Math.round(a.totalPrice / a.totalTimes) : 0 }

function navigateBack() { router.push('/') }
function goDetail(asset) { if (!guard()) return; router.push(`/asset-detail?id=${asset.id}`) }
function goWriteOff(asset) { if (!guard()) return; router.push(`/write-off?id=${asset.id}`) }
function goEvidence(asset) { if (!guard()) return; router.push(`/evidence-folder?assetId=${asset.id}`) }
function goAdd() { if (!guard()) return; router.push('/package-input') }

// 管理：编辑资产
function startEdit(asset) {
  if (!guard()) return
  editForm.storeName = asset.storeName || ''
  editForm.scene = asset.scene || ''
  editForm.totalPrice = asset.totalPrice || ''
  editForm.totalTimes = asset.totalTimes || ''
  editForm.validityMonths = asset.validityMonths || ''
  editing.value = asset
}

function saveEdit() {
  const a = editing.value
  if (!a) return
  const price = parseFloat(editForm.totalPrice)
  const times = parseInt(editForm.totalTimes)
  const months = parseInt(editForm.validityMonths)
  if (!editForm.storeName.trim()) { $toast('请输入门店名称'); return }
  if (!price || price <= 0) { $toast('请输入有效的预付总价'); return }
  if (!times || times <= 0) { $toast('请输入有效的总次数'); return }
  if (!months || months <= 0) { $toast('请输入有效的有效期'); return }

  updateAsset(a.id, {
    storeName: editForm.storeName.trim(),
    scene: editForm.scene.trim(),
    totalPrice: price,
    totalTimes: times,
    validityMonths: months
  })
  $toast('资产已更新')
  editing.value = null
  refreshKey.value++
}

// 管理：删除资产
function confirmDelete(asset) {
  if (!guard()) return
  if (window.confirm(`确认删除「${asset.storeName} · ${asset.scene}」？\n\n删除后无法恢复，关联的核销记录和证据资料夹也会一并清除。`)) {
    // 清理关联的核销记录
    const writeoffs = getWriteOffs(asset.id)
    writeoffs.forEach(w => deleteWriteOff(w.id))
    // 清理关联的暂停/转卡记录
    const pauses = getPauses(asset.id)
    if (pauses.length) set(KEYS.PAUSES, getPauses().filter(p => p.assetId !== asset.id))
    // 清理关联的资料夹及其文件
    const folders = getFolders().filter(f => f.assetId === asset.id)
    folders.forEach(f => {
      const files = getFiles(f.id)
      files.forEach(file => deleteFile(file.id))
      deleteFolder(f.id)
    })
    // 删除资产本身
    deleteAsset(asset.id)
    $toast('资产及相关记录已删除')
    refreshKey.value++
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #fff; padding-bottom: 56px; }
.nav-bar { display: flex; align-items: center; height: 44px; padding: 0 16px; border-bottom: 0.5px solid #48A9A6; }
.back { font-size: 15px; color: #48A9A6; cursor: pointer; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; }

.stats-bar { margin: 14px 16px; padding: 14px; }
.stats-amount { display: block; font-size: 22px; font-weight: bold; color: #48A9A6; }
.stats-label { display: block; font-size: 12px; color: #888; margin-top: 2px; }
.stats-info { display: block; font-size: 12px; color: #888; margin-top: 8px; }

.empty-card { margin: 80px 16px; text-align: center; padding: 40px 0; border: 1px dashed #48A9A6; border-radius: 12px; }
.empty-text { display: block; font-size: 16px; color: #245957; }
.empty-hint { display: block; font-size: 12px; color: #638F8D; margin-top: 8px; }

.asset-card { margin: 8px 16px; padding: 14px; display: flex; position: relative; }
.asset-bar { width: 3px; height: 16px; background: #48A9A6; border-radius: 1.5px; margin-right: 12px; margin-top: 4px; }
.asset-info { flex: 1; }
.asset-name { display: block; font-size: 15px; font-weight: bold; color: #245957; }
.asset-status { display: inline-block; font-size: 10px; font-weight: bold; color: #48A9A6; margin-left: 8px; }
.asset-meta { display: block; font-size: 12px; color: #888; margin-top: 4px; }
.asset-unit { display: block; font-size: 12px; color: #888; }
.asset-actions { display: flex; flex-direction: column; gap: 4px; align-self: flex-end; }
.btn-writeoff { width: 64px; height: 28px; background: #48A9A6; color: #fff; font-size: 11px; font-weight: bold; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.btn-voucher { width: 64px; height: 28px; background: #fff; color: #245957; font-size: 11px; font-weight: bold; border: 1px solid #48A9A6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }

.btn-add { margin: 14px 16px; height: 44px; background: #48A9A6; color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; cursor: pointer; }

.manage-bar { display: flex; justify-content: flex-end; margin: 0 16px 4px; }
.btn-manage { padding: 6px 14px; font-size: 12px; font-weight: bold; color: #48A9A6; border: 1px solid #48A9A6; border-radius: 14px; cursor: pointer; transition: all .15s; }
.btn-manage.active { background: #48A9A6; color: #fff; }

.asset-card.manage-mode { border-color: #E8686A; background: #FFF8F8; }
.asset-actions-manage { display: flex; gap: 8px; align-self: flex-end; }
.btn-edit { width: 32px; height: 32px; background: #48A9A6; color: #fff; font-size: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.btn-del { width: 32px; height: 32px; background: #E8686A; color: #fff; font-size: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.mask { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.edit-modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 24px; max-height: 80vh; overflow-y: auto; }
.modal-title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; margin-bottom: 16px; }
.label { display: block; font-size: 14px; color: #245957; margin: 8px 0 4px; font-weight: bold; }
.input-blue { width: 100%; height: 44px; background: #fff; border: 1.5px solid #48A9A6; border-radius: 12px; padding: 0 12px; font-size: 15px; color: #245957; outline: none; margin-bottom: 4px; }
.btn-row { display: flex; gap: 12px; margin-top: 16px; }
.flex-1 { flex: 1; }
.btn-primary { height: 44px; background: #48A9A6; color: #fff; border-radius: 8px; border: none; font-size: 15px; font-weight: bold; cursor: pointer; }
.btn-secondary { height: 44px; background: #fff; color: #48A9A6; border: 1px solid #48A9A6; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; }
</style>
