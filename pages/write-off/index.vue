<!-- 核销记录录入页 · 对应PRD §4.7 · 线框图 ✓ 核销记录录入-美化版 -->
<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 持仓卡</span>
      <span class="title">核销记录录入</span>
    </div>
    <div v-if="!asset" class="empty-state">未找到关联资产，请从资产列表进入</div>
    <template v-if="asset">
    <!-- 资产信息卡片 -->
    <div class="card-blue asset-info">
      <span class="info-label">关联资产卡</span>
      <span class="info-name">{{ asset.storeName }}</span>
      <!-- 普通模式 -->
      <span class="info-meta" v-if="!isUnlimited">剩余 {{ scoped.remainingTimes }} 次 / {{ scoped.remainingDays }} 天</span>
      <!-- 无限次模式 -->
      <span class="info-meta" v-else>已到店 {{ asset.usedTimes || 0 }} 次 · 剩余 {{ scoped.remainingDays }} 天</span>
      <div class="cost-badge" v-if="isUnlimited && asset.usedTimes > 0">
        单次到店成本 ≈ ¥{{ perVisitCost }} · 日均 ¥{{ dailyCost }}
      </div>
    </div>

    <!-- 核销表单 -->
    <div class="card-blue form-card">
      <span class="section-title">{{ isUnlimited ? '到店打卡' : '核销信息' }}</span>
      <span class="label"><span class="star">*</span> {{ isUnlimited ? '打卡日期' : '核销日期' }}</span>
      <input class="input-blue" v-model="form.date" type="date" />

      <!-- 普通模式：手动输入次数 -->
      <template v-if="!isUnlimited">
        <span class="label"><span class="star">*</span> {{ wCopy.unitLabel }}</span>
        <input class="input-blue" v-model="form.hours" type="number" :placeholder="wCopy.unitHint" />
        <span class="save-note">{{ wCopy.saveNote }}</span>
      </template>

      <!-- 无限次模式：自动1次 + 频率分析 -->
      <template v-else>
        <div class="checkin-badge">
          <svg class="checkin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>{{ wCopy.checkinMsg }}</span>
        </div>
        <div class="freq-tip" v-if="freqAdvice">
          {{ freqAdvice }}
        </div>
      </template>

      <span class="label">备注（选填）</span>
      <input class="input-blue" v-model="form.note" :placeholder="wCopy.noteHint" />
      <span class="save-note" v-if="isUnlimited">打卡后自动累计到店次数，帮你追踪是否值回票价</span>
    </div>

    <div class="btn-primary save-btn" @click="onSave">{{ isUnlimited ? '打卡记录' : '保存核销记录' }}</div>

    <!-- 近期记录 -->
    <span class="section-title" style="margin:16px 16px 8px">{{ isUnlimited ? '近期打卡记录' : '近期核销记录' }}</span>
    <div v-if="!records.length" class="no-records">暂无记录，开始{{ isUnlimited ? '打卡' : '核销' }}吧</div>
    <div class="record-item" v-for="r in records" :key="r.id" @click="showDetail(r)">
      <span class="record-text" v-if="!isUnlimited">{{ r.date }}  {{ r.note || '核销' }}  剩余{{ r.remainingAfter }}{{ wCopy.unit }}</span>
      <span class="record-text" v-else>{{ r.date }}  {{ r.note || '到店打卡' }}  累计{{ r.remainingAfter }}{{ wCopy.unit }}到店</span>
    </div>

    <write-off-detail v-if="detailRecord" :record="detailRecord" :isUnlimited="isUnlimited" @close="detailRecord = null" @deleted="onDeleted" @updated="onUpdated" />
    </template>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, reactive, computed, onMounted } from 'vue'
import { getAssetById, getWriteOffs, addWriteOff, updateAsset, deleteWriteOff } from '@/common/storage.js'
import { isPositiveInt } from '@/common/validator.js'
import { track } from '@/common/analytics.js'
import WriteOffDetail from '@/components/write-off-detail/index.vue'

// ── 核销页场景化文案 ──
const WRITEOFF_COPY = {
  '健身/舞蹈': { unit: '次', unitLabel: '消耗次数', unitHint: '输入本次消耗次数', noteHint: '训练内容、教练姓名等', saveNote: '保存后自动回写资产详情，更新剩余次数与到期测算', checkinMsg: '本次到店锻炼自动计 1 次' },
  '培训课程': { unit: '课时', unitLabel: '消耗课时', unitHint: '输入本次消耗课时', noteHint: '上课内容、授课老师等', saveNote: '保存后自动回写资产详情，更新剩余课时与到期测算', checkinMsg: '本次上课自动计 1 课时' },
  '摄影套餐': { unit: '套', unitLabel: '拍摄套数', unitHint: '输入本次拍摄套数', noteHint: '拍摄内容、摄影师等', saveNote: '保存后自动回写资产详情，更新剩余套数与到期测算', checkinMsg: '本次约拍自动计 1 套' },
  '美容美发': { unit: '次', unitLabel: '消费次数', unitHint: '输入本次消费次数', noteHint: '服务项目、发型师等', saveNote: '保存后自动回写资产详情，更新剩余次数与到期测算', checkinMsg: '本次到店消费自动计 1 次' },
}
const DEFAULT_WRITEOFF = { unit: '次', unitLabel: '消耗次数', unitHint: '输入消耗次数', noteHint: '训练内容、教练姓名等', saveNote: '保存后自动回写资产详情，更新剩余次数与到期测算', checkinMsg: '本次到店自动计 1 次打卡' }

// 根据资产场景获取文案
const wCopy = computed(() => {
  const scene = asset.value?.scene || ''
  return WRITEOFF_COPY[scene] || DEFAULT_WRITEOFF
})

const router = useRouter()
const route = useRoute()
const $toast = (msg) => window.__toast?.(msg)
const asset = ref(null)
const records = ref([])
const detailRecord = ref(null)
const form = reactive({ date: new Date().toISOString().slice(0,10), hours: '1', note: '' })

const scoped = reactive({ remainingTimes: 0, remainingDays: 0 })

// 无限次模式判断
const isUnlimited = computed(() => !!(asset.value?.unlimited))

// 无限次模式下的成本指标
const perVisitCost = computed(() => {
  const a = asset.value
  if (!a || !a.usedTimes) return '--'
  return Math.round(a.totalPrice / a.usedTimes).toLocaleString()
})
const dailyCost = computed(() => {
  const a = asset.value
  if (!a) return '--'
  const months = a.validityMonths || 12
  return Math.round(a.totalPrice / (months * 30)).toLocaleString()
})

// 频率建议：基于已到店次数和已过天数
const freqAdvice = computed(() => {
  const a = asset.value
  if (!a || !a.createdAt) return ''
  const used = a.usedTimes || 0
  const created = new Date(a.createdAt)
  const daysSinceStart = Math.max(1, Math.ceil((Date.now() - created) / 86400000))
  const months = a.validityMonths || 12
  const totalDays = months * 30
  const elapsedRatio = daysSinceStart / totalDays

  // 理想到店次数（按时间比例）
  const expectedVisits = Math.round(used / Math.max(0.01, elapsedRatio))
  const weeklyAvg = (used / Math.max(1, daysSinceStart / 7)).toFixed(1)

  if (used === 0) return '完成首次打卡，开始追踪到店频率'
  if (elapsedRatio > 0.7 && used < 5) return `已过${Math.round(elapsedRatio*100)}%有效期，仅到店${used}次，周均${weeklyAvg}次偏少`
  if (weeklyAvg >= 3) return `周均到店 ${weeklyAvg} 次，频率很好，物有所值`
  if (weeklyAvg >= 1.5) return `周均到店 ${weeklyAvg} 次，频率适中`
  return `周均到店 ${weeklyAvg} 次，建议保持规律到店`
})

onMounted(() => {
  const id = route.query.id
  if (id) {
    asset.value = getAssetById(id)
    if (!asset.value) return

    // 检查资产是否已过期
    const end = new Date(asset.value.createdAt)
    end.setMonth(end.getMonth() + (asset.value.validityMonths || 12))
    const remainingDays = Math.max(0, Math.ceil((end - Date.now()) / 86400000))
    if (remainingDays <= 0 && !asset.value.noExpiry) {
      $toast?.('该套餐已失效，无法进行核销')
      router.replace(`/asset-detail?id=${asset.value.id}`)
      return
    }

    // 检查资产是否处于暂停锁卡状态
    if (asset.value.status === 'paused') {
      $toast?.('该套餐已暂停锁卡，暂停期内无法核销')
      router.replace(`/asset-detail?id=${asset.value.id}`)
      return
    }

    records.value = getWriteOffs(id)
    scoped.remainingTimes = (asset.value.totalTimes || 0) - (asset.value.usedTimes || 0)
    scoped.remainingDays = remainingDays
  }
})

function onSave() {
  if (!form.date) { $toast?.('请选择日期'); return }
  // 阻拦未来日期
  if (form.date > new Date().toISOString().slice(0, 10)) {
    $toast?.('不能选择未来日期进行核销')
    return
  }

  // 无限次模式：自动计1次打卡
  if (isUnlimited.value) {
    const latest = getAssetById(asset.value.id)
    if (!latest) { $toast?.('关联资产不存在'); return }
    const newUsed = (latest.usedTimes || 0) + 1
    updateAsset(asset.value.id, { usedTimes: newUsed })
    addWriteOff({ assetId: asset.value.id, date: form.date, hours: 1, note: form.note, remainingAfter: newUsed })
    asset.value = getAssetById(asset.value.id)
    if (!asset.value) { $toast?.('打卡已记录'); return }
    records.value = getWriteOffs(asset.value.id)
    form.note = ''
    track('打卡', '到店记录', asset.value.storeName)
    $toast?.('打卡已记录')
    return
  }

  // 普通模式：手动输入次数
  if (!form.hours || !isPositiveInt(form.hours)) { $toast?.('请输入有效的消耗次数'); return }
  const h = parseInt(form.hours)
  if (h > scoped.remainingTimes) { $toast?.('消耗次数不可超过剩余课时'); return }
  addWriteOff({ assetId: asset.value.id, date: form.date, hours: h, note: form.note, remainingAfter: scoped.remainingTimes - h })
  const latest = getAssetById(asset.value.id)
  if (!latest) { $toast?.('关联资产不存在'); return }
  const newUsed = (latest.usedTimes || 0) + h
  updateAsset(asset.value.id, { usedTimes: newUsed })
  asset.value = getAssetById(asset.value.id)
  if (!asset.value) { $toast?.('核销记录已保存'); return }
  scoped.remainingTimes = (asset.value.totalTimes || 0) - (asset.value.usedTimes || 0)
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
    if (!isUnlimited.value) {
      scoped.remainingTimes = (asset.value.totalTimes || 0) - (asset.value.usedTimes || 0)
    }
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

/* 无限次模式专属样式 */
.cost-badge {
  margin-top: 8px; padding: 6px 12px;
  background: #B8E6E1; border-radius: 6px;
  font-size: 11px; color: #245957; font-weight: bold;
}
.checkin-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; margin: 4px 0 8px;
  background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 8px;
  font-size: 13px; color: #245957; font-weight: bold;
}
.checkin-icon { flex-shrink: 0; }
.freq-tip {
  padding: 8px 12px; margin-bottom: 8px;
  background: #F5FAFA; border: 1px dashed #48A9A6; border-radius: 6px;
  font-size: 12px; color: #4A7A77; line-height: 1.5;
}
.no-records {
  text-align: center; padding: 24px 16px;
  font-size: 13px; color: #638F8D;
}
</style>
