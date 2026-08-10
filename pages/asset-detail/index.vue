<!--
  青付安 — 预付权益持仓卡 /asset-detail
  对应 PRD §4.6 · 线框图 💳 预付资产持仓卡-美化版
  权益动态测算、核销/暂停/退款/凭证四大功能
-->
<template>
  <div class="page" v-if="asset">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 资产列表</span>
      <span class="title">预付资产持仓卡</span>
    </div>

    <!-- 名称+状态标签 -->
    <div class="card-blue header-card">
      <div class="module-bar" />
      <span class="asset-name">{{ asset.storeName }} · {{ scoped.scene }}</span>
      <div class="status-tag" :class="statusClass">{{ statusLabel }}</div>
    </div>

    <!-- 权益动态测算 -->
    <div class="card-blue data-card">
      <span class="section-title">资产数据</span>
      <div class="divider" />
      <div class="data-row">
        <span class="data-label">预付参考总额</span>
        <span class="data-value">{{ locked ? "•••" : asset.totalPrice?.toLocaleString() }} 元</span>
      </div>
      <div class="data-row">
        <span class="data-label">履约期限</span>
        <span class="data-value">{{ scoped.startDate }} — {{ scoped.endDate }}</span>
      </div>
      <div class="data-row">
        <span class="data-label">剩余有效期</span>
        <span class="data-value">{{ locked ? "•••" : scoped.remainingDays }} 天</span>
      </div>
      <div class="data-row">
        <span class="data-label">课时履约</span>
        <span class="data-value">剩余 {{ locked ? "•••" : scoped.remainingTimes }} 次 / 总 {{ asset.totalTimes }} 次（已用 {{ scoped.usedPercent }}%）</span>
      </div>
      <div class="data-row">
        <span class="data-label">当前实际单次成本</span>
        <span class="data-value highlight">{{ locked ? "•••" : scoped.actualUnitCost }} 元/次</span>
      </div>
      <div class="data-row">
        <span class="data-label">剩余权益参考值</span>
        <span class="data-value">{{ locked ? "•••" : scoped.remainingValue?.toLocaleString() }} 元</span>
      </div>

      <!-- 使用进度条 -->
      <span class="data-label" style="margin-top:12px">使用进度</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: scoped.usedPercent + '%' }" />
      </div>
      <span class="warn-text" v-if="scoped.usedPercent < 30">使用率偏低，资产存在贬值风险</span>
    </div>

    <!-- 预警提示 -->
    <div v-if="scoped.warning" class="card-blue warn-card">
      <span class="warn-title">资产缩水预警 ｜ 剩余 {{ locked ? "•••" : scoped.remainingDays }} 天有效期</span>
      <span class="warn-desc">当前使用频次不足，建议固定到店频次或办理暂停锁卡</span>
    </div>

    <!-- 历史风控备注 -->
    <div v-if="scoped.riskNote" class="risk-note">{{ scoped.riskNote }}</div>

    <!-- 四大功能按钮 -->
    <div class="btn-group">
      <div class="btn-primary" @click="goWriteOff" :class="{ disabled: asset.status === 'expired' }">◯ 核销记录</div>
      <div class="btn-primary" @click="showPause = true">◯ 暂停 / 转卡</div>
      <div class="btn-secondary" @click="showRefund = true">◯ 申请退款</div>
      <div class="btn-secondary" @click="goEvidence">◯ 查看证据资料</div>
    </div>

    <span class="disclaimer">权益数值为动态测算结果，线下协商以合同原件为准</span>

    <!-- 子组件 -->
    <pause-transfer v-if="showPause" :asset="asset" @close="showPause = false" />
    <refund-checklist v-if="showRefund" :asset="asset" @close="showRefund = false" />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
import { ref, computed, reactive, onMounted } from 'vue'
import { locked } from '@/store/lock.js'
import { getAssetById, getWriteOffs } from '@/common/storage.js'
import PauseTransfer from '@/components/pause-transfer/index.vue'
import RefundChecklist from '@/components/refund-checklist/index.vue'

const asset = ref(null)
const showPause = ref(false)
const showRefund = ref(false)

const scoped = reactive({
  scene: '', startDate: '', endDate: '', remainingDays: 0,
  remainingTimes: 0, usedPercent: 0, actualUnitCost: 0,
  remainingValue: 0, warning: false, riskNote: ''
})

const statusLabel = computed(() =>
  asset.value?.status === 'expired' ? '已过期' : asset.value?.status === 'paused' ? '已暂停' : '使用中'
)
const statusClass = computed(() =>
  asset.value?.status === 'expired' ? 'expired' : asset.value?.status === 'paused' ? 'paused' : 'active'
)

onMounted(() => {
  const route = useRoute()
  const id = route.query.id
  if (id) {
    asset.value = getAssetById(id)
    if (asset.value) calcScope()
  }
})

function calcScope() {
  const a = asset.value
  const created = new Date(a.createdAt)
  const end = new Date(created); end.setMonth(end.getMonth() + (a.validityMonths || 12))
  scoped.scene = a.scene || ''
  scoped.startDate = created.toISOString().slice(0, 10)
  scoped.endDate = end.toISOString().slice(0, 10)
  scoped.remainingDays = Math.max(0, Math.ceil((end - Date.now()) / 86400000))
  scoped.remainingTimes = (a.totalTimes || 0) - (a.usedTimes || 0)
  scoped.usedPercent = a.totalTimes ? Math.round((a.usedTimes || 0) / a.totalTimes * 100) : 0
  scoped.actualUnitCost = a.totalTimes ? Math.round(a.totalPrice / a.totalTimes) : 0
  scoped.remainingValue = scoped.remainingTimes * (a.totalTimes ? a.totalPrice / a.totalTimes : 0)
  scoped.warning = scoped.remainingDays <= 30 && scoped.remainingTimes > 0
}

function navigateBack() { router.push('/asset-list') }
function goWriteOff() { router.push(`/write-off?id=${asset.value.id}`) }
function goEvidence() { router.push(`/evidence-folder?assetId=${asset.value.id}`) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #fff; padding-bottom: 56px; }
.nav-bar { display: flex; align-items: center; height: 44px; padding: 0 16px; border-bottom: 0.5px solid #48A9A6; }
.back { font-size: 15px; color: #48A9A6; cursor: pointer; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; }

.header-card { margin: 8px 16px; padding: 14px; display: flex; align-items: center; }
.module-bar { width: 3px; height: 18px; background: #48A9A6; border-radius: 1.5px; margin-right: 10px; }
.asset-name { flex: 1; font-size: 18px; font-weight: bold; color: #245957; }
.status-tag { padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; }
.status-tag.active { border: 1px solid #48A9A6; color: #48A9A6; }
.status-tag.expired { background: #B8E6E1; color: #638F8D; }
.status-tag.paused { background: #B8E6E1; color: #48A9A6; }

.data-card { margin: 8px 16px; padding: 14px; }
.section-title { font-size: 17px; font-weight: bold; color: #245957; }
.divider { height: 0.5px; background: #48A9A6; margin: 8px 0; }
.data-row { display: flex; justify-content: space-between; padding: 6px 0; }
.data-label { font-size: 14px; color: #888; }
.data-value { font-size: 15px; font-weight: bold; color: #245957; }
.data-value.highlight { color: #48A9A6; }

.progress-bar { height: 6px; background: #EFEFEF; border-radius: 4px; margin: 6px 0; overflow: hidden; }
.progress-fill { height: 100%; background: #48A9A6; border-radius: 4px; transition: width .3s; }
.warn-text { font-size: 12px; color: #48A9A6; margin-top: 4px; }

.warn-card { margin: 8px 16px; padding: 14px; background: #B8E6E1; }
.warn-title { display: block; font-size: 16px; font-weight: bold; color: #245957; }
.warn-desc { display: block; font-size: 13px; color: #888; margin-top: 4px; }

.risk-note { margin: 8px 16px; padding: 10px 14px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; font-size: 12px; color: #48A9A6; }

.btn-group { margin: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.btn-group .btn-primary.disabled { background: #B8E6E1; color: #638F8D; }

.disclaimer { text-align: center; font-size: 11px; color: #888; padding: 16px; }
</style>
