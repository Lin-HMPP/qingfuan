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
      <span class="stats-info">在库储值卡 {{ locked ? '•••' : assets.length }} 张 ｜ 即将到期 {{ expiringCount }} 张</span>
    </div>

    <!-- 空态 -->
    <div v-if="!assets.length" class="empty-card"><svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round" opacity="0.5"><rect x="8" y="14" width="32" height="24" rx="3"/><line x1="8" y1="22" x2="40" y2="22"/><line x1="24" y1="22" x2="24" y2="38"/><line x1="16" y1="28" x2="20" y2="28"/></svg>
      <span class="empty-text">暂无预付资产记录</span>
      <span class="empty-hint">录入第一张预付卡，开始管理你的消费权益</span>
    </div>

    <!-- 资产卡片列表 -->
    <div v-for="asset in assets" :key="asset.id" class="card-blue asset-card" @click="goDetail(asset)">
      <div class="asset-bar" />
      <div class="asset-info">
        <span class="asset-name">{{ asset.storeName }} · {{ asset.scene }}</span>
        <span class="asset-status" v-if="isExpiring(asset)">即将到期</span>
        <span class="asset-meta">剩余 {{ asset.totalTimes - asset.usedTimes }}/{{ asset.totalTimes }}次 ｜ 到期 {{ remainingDays(asset) }}天</span>
        <span class="asset-unit">单次 ¥{{ locked ? '•••' : unitCost(asset) }}</span>
      </div>
      <div class="asset-actions">
        <div class="btn-writeoff" @click.stop="goWriteOff(asset)">核销</div>
        <div class="btn-voucher" @click.stop="goEvidence(asset)">凭证</div>
      </div>
    </div>

    <!-- 新增按钮 -->
    <div class="btn-add" @click="goAdd">+ 新增预付卡</div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { locked } from '@/store/lock.js'
import { getAssets } from '@/common/storage.js'

const router = useRouter()
const $toast = (msg) => window.__toast?.(msg)
function guard() { if (locked.value) { $toast('信息已锁定，请先解锁'); return false } return true }
const assets = computed(() => getAssets())
const totalAmount = computed(() => assets.value.reduce((s, a) => s + (a.totalPrice || 0), 0))
const expiringCount = computed(() => assets.value.filter(a => isExpiring(a)).length)

function remainingDays(a) {
  const end = new Date(a.createdAt)
  end.setMonth(end.getMonth() + (a.validityMonths || 12))
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
}
function isExpiring(a) { return remainingDays(a) <= 30 }
function unitCost(a) { return a.totalTimes ? Math.round(a.totalPrice / a.totalTimes) : 0 }

function navigateBack() { router.push('/') }
function goDetail(asset) { if (!guard()) return; router.push(`/asset-detail?id=${asset.id}`) }
function goWriteOff(asset) { if (!guard()) return; router.push(`/write-off?id=${asset.id}`) }
function goEvidence(asset) { if (!guard()) return; router.push(`/evidence-folder?assetId=${asset.id}`) }
function goAdd() { if (!guard()) return; router.push('/package-input') }
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

.btn-add { margin: 14px 16px; height: 44px; background: #48A9A6; color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; }
</style>
