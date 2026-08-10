<!-- 核销记录录入页 · 对应PRD §4.7 · 线框图 ✓ 核销记录录入-美化版 -->
<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 持仓卡</span>
      <span class="title">核销记录录入</span>
    </div>
    <div v-if="!asset" class="empty-state">未找到关联资产，请从资产列表进入</div>
    <template v-if="asset">
    <div class="card-blue asset-info">
      <span class="info-label">关联资产卡</span>
      <span class="info-name">{{ asset.storeName }}</span>
      <span class="info-meta">剩余 {{ scoped.remainingTimes }} 次 / {{ scoped.remainingDays }} 天</span>
    </div>
    <div class="card-blue form-card">
      <span class="section-title">核销信息</span>
      <span class="label"><span class="star">*</span> 核销日期</span>
      <input class="input-blue" v-model="form.date" type="date" />
      <span class="label"><span class="star">*</span> 本次消耗课时</span>
      <input class="input-blue" v-model="form.hours" type="number" placeholder="输入消耗次数" />
      <span class="label">备注（选填）</span>
      <input class="input-blue" v-model="form.note" placeholder="训练内容、教练姓名等" />
      <span class="save-note">保存后自动回写资产详情，更新剩余课时与到期测算</span>
    </div>
    <div class="btn-primary save-btn" @click="onSave">保存核销记录</div>

    <span class="section-title" style="margin:16px 16px 8px">近期核销记录</span>
    <div class="record-item" v-for="r in records" :key="r.id" @click="showDetail(r)">
      <span class="record-text">{{ r.date }}  {{ r.note || '核销' }}  剩余{{ r.remainingAfter }}次</span>
    </div>

    <write-off-detail v-if="detailRecord" :record="detailRecord" @close="detailRecord = null" @deleted="onDeleted" @updated="onUpdated" />
    </template>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, reactive, onMounted } from 'vue'
import { getAssetById, getWriteOffs, addWriteOff, updateAsset, deleteWriteOff } from '@/common/storage.js'
import { isPositiveInt } from '@/common/validator.js'
import { track } from '@/common/analytics.js'
import WriteOffDetail from '@/components/write-off-detail/index.vue'

const router = useRouter()
const route = useRoute()
const $toast = (msg) => window.__toast?.(msg)
const asset = ref(null)
const records = ref([])
const detailRecord = ref(null)
const form = reactive({ date: new Date().toISOString().slice(0,10), hours: '', note: '' })

const scoped = reactive({ remainingTimes: 0, remainingDays: 0 })

onMounted(() => {
  const id = route.query.id
  if (id) {
    asset.value = getAssetById(id)
    records.value = getWriteOffs(id)
    const end = new Date(asset.value.createdAt)
    end.setMonth(end.getMonth() + (asset.value.validityMonths || 12))
    scoped.remainingTimes = (asset.value.totalTimes || 0) - (asset.value.usedTimes || 0)
    scoped.remainingDays = Math.max(0, Math.ceil((end - Date.now()) / 86400000))
  }
})

function onSave() {
  if (!form.hours || !isPositiveInt(form.hours)) { $toast?.('请输入有效的消耗次数'); return }
  const h = parseInt(form.hours)
  if (h > scoped.remainingTimes) { $toast?.('消耗次数不可超过剩余课时'); return }
  addWriteOff({ assetId: asset.value.id, date: form.date, hours: h, note: form.note, remainingAfter: scoped.remainingTimes - h })
  updateAsset(asset.value.id, { usedTimes: (asset.value.usedTimes || 0) + h })
  scoped.remainingTimes -= h
  records.value = getWriteOffs(asset.value.id)
  form.hours = ''; form.note = ''
  track('核销', '保存记录', asset.value.storeName, h)
  $toast?.('核销记录已保存')
}

function refreshAsset() {
  asset.value = getAssetById(asset.value?.id)
  if (asset.value) {
    const end = new Date(asset.value.createdAt)
    end.setMonth(end.getMonth() + (asset.value.validityMonths || 12))
    scoped.remainingTimes = (asset.value.totalTimes || 0) - (asset.value.usedTimes || 0)
    scoped.remainingDays = Math.max(0, Math.ceil((end - Date.now()) / 86400000))
  }
}

function showDetail(r) { detailRecord.value = r }
function onUpdated() {
  detailRecord.value = null
  refreshAsset()
  records.value = getWriteOffs(asset.value?.id)
}
function onDeleted() {
  detailRecord.value = null
  refreshAsset()
  records.value = getWriteOffs(asset.value?.id)
}

function navigateBack() { router.push(`/asset-detail?id=${asset.value?.id || ''}`) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #fff; padding-bottom: 56px; }
.nav-bar { display: flex; align-items: center; height: 44px; padding: 0 16px; border-bottom: 0.5px solid #48A9A6; }
.back { font-size: 15px; color: #48A9A6; cursor: pointer; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; }
.card-blue { margin: 8px 16px; padding: 14px; background: #fff; border: 1px solid #48A9A6; border-radius: 12px; }
.asset-info .info-label { font-size: 12px; color: #888; display: block; }
.asset-info .info-name { font-size: 15px; font-weight: bold; color: #245957; display: block; }
.asset-info .info-meta { font-size: 13px; color: #888; }
.section-title { font-size: 15px; font-weight: bold; color: #245957; }
.label { display: block; font-size: 14px; color: #245957; margin: 12px 0 4px; }
.star { color: #E8686A; }
.save-note { display: block; font-size: 11px; color: #888; margin-top: 6px; }
.save-btn { margin: 14px 16px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
.record-item { margin: 4px 16px; padding: 8px 12px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 8px; }
.record-text { font-size: 12px; color: #888; }
.input-blue { background: #fff; border: 1px solid #48A9A6; }
.empty-state { text-align: center; padding: 60px 16px; font-size: 14px; color: #638F8D; }
</style>
