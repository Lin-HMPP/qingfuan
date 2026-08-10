<template>
  <div class="page">
    <!-- 顶栏 -->
    <div class="nav-bar">
      <span class="logo">青付安</span>
      <div class="nav-icons">
        <div class="icon-dot" />
        <div class="icon-avatar" />
      </div>
    </div>

    <!-- 标题区 -->
    <div class="hero">
      <div class="hero-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="24" cy="24" r="20"/>
          <path d="M16 24l6 6 10-12"/>
        </svg>
      </div>
      <h2 class="hero-title">预付消费，看得懂、算得清、管得住</h2>
      <p class="hero-sub">大学生&职场青年预付资金管理助手</p>
      <p class="hero-tag">门店跑路止损 · 卡项过期提醒 · 纠纷一键维权</p>
    </div>

    <!-- 即将到期提醒 -->
    <div class="card-blue expire-card">
      <div class="expire-header" @click="goAssets">
        <span class="expire-title">即将到期提醒</span>
        <span class="arrow-blue" v-if="expiringList.length">查看全部 ›</span>
      </div>
      <div v-if="locked" class="expire-empty">信息已锁定</div>
      <div v-else-if="!expiringList.length" class="expire-empty">暂无即将到期的预付卡</div>
      <template v-else>
        <div v-for="a in expiringList" :key="a.id" class="expire-item">
          <span class="expire-info" :class="{ urgent: a.remainingDays <= 7 }">{{ a.storeName }} · 剩余{{ a.remainingDays }}天 ｜ 剩余{{ a.remainingTimes }}次</span>
          <div class="btn-writeoff" @click="goWriteOff(a)">核销</div>
          <div class="btn-voucher" @click="goEvidence(a)">凭证</div>
        </div>
      </template>
    </div>

    <!-- 双入口：快速录入 + 完整评估 -->
    <div class="entry-section">
      <div class="entry-card entry-quick" @click="goQuickInput">
        <div class="entry-icon">⚡</div>
        <div class="entry-body">
          <span class="entry-title">快速录入一张卡</span>
          <span class="entry-desc">3 步 · 10 秒完成</span>
        </div>
        <span class="entry-arrow">›</span>
      </div>
      <div class="entry-card entry-full" @click="goCheck">
        <div class="entry-icon">📋</div>
        <div class="entry-body">
          <span class="entry-title">完整录入（含风险评估）</span>
          <span class="entry-desc">深度分析 · 约 2 分钟</span>
        </div>
        <span class="entry-arrow">›</span>
      </div>
    </div>

    <!-- 资产概览 -->
    <div class="stats-line" @click="goAssets" v-if="assetCount > 0">
      <span>预付总额 <b>{{ locked ? '•••' : totalAmount.toLocaleString() }}</b> 元 · 在库 <b>{{ locked ? '•••' : assetCount }}</b> 张</span>
      <span class="stats-arrow">查看全部 ›</span>
    </div>

    <!-- 消费证据资料夹 -->
    <div class="card-blue evidence-card" @click="goEvidenceFolder">
      <div class="card-bar" />
      <svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      <span class="card-title">消费证据资料夹</span>
      <p class="card-desc-long">归集合同、付款截图、核销记录，纠纷一键导出全套维权凭证</p>
      <span class="link-blue" @click.stop="goNewFolder">新建资料夹 ›</span>
    </div>

    <!-- 常用预付场景 -->
    <span class="section-title">常用预付场景</span>
    <div class="scene-tags">
      <div class="tag" v-for="s in scenes" :key="s" @click="goInput(s)">{{ s }}</div>
      <div class="tag tag-custom" @click="showCustomScene = true">+ 自定义</div>
    </div>

    <p class="disclaimer">本工具仅提供预付消费信息管理，不涉及任何资金托管与线上交易服务</p>

    <scene-custom v-if="showCustomScene" @confirm="onCustomScene" @close="showCustomScene = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAssets } from '@/common/storage.js'
import { locked } from '@/store/lock.js'
import { track } from '@/common/analytics.js'
import SceneCustom from '@/components/scene-picker/custom.vue'

const router = useRouter()
const $toast = (msg) => window.__toast?.(msg)
const showCustomScene = ref(false)
const scenes = ['健身/舞蹈', '培训课程', '摄影套餐', '美容美发']

// 统一锁检查：锁定状态下给出反馈
function guard() {
  if (locked.value) {
    $toast('信息已锁定，请先解锁')
    return false
  }
  return true
}

// 实时读取资产（每次 computed 求值时从 localStorage 获取最新数据）
const assets = computed(() => getAssets())

// 到期判定
function remainingDays(a) {
  const end = new Date(a.createdAt)
  end.setMonth(end.getMonth() + (a.validityMonths || 12))
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
}
function remainingTimes(a) { return (a.totalTimes || 0) - (a.usedTimes || 0) }

// 即将到期列表
const expiringList = computed(() =>
  assets.value.filter(a => a.status !== 'expired' && remainingDays(a) <= 30 && remainingDays(a) > 0)
    .map(a => ({ ...a, remainingDays: remainingDays(a), remainingTimes: remainingTimes(a) }))
    .sort((a, b) => a.remainingDays - b.remainingDays).slice(0, 3)
)
const totalAmount = computed(() => assets.value.reduce((s, a) => s + (a.totalPrice || 0), 0))
const assetCount = computed(() => assets.value.length)

function goQuickInput() { if (!guard()) return; router.push('/quick-input'); track('首页', '快速录入') }
function goCheck() { if (!guard()) return; router.push('/package-input'); track('首页', '点击测算') }
function goAssets() { if (!guard()) return; router.push('/asset-list'); track('首页', '查看资产') }
function goEvidenceFolder() { if (!guard()) return; router.push('/evidence-folder'); track('首页', '打开证据夹') }
function goNewFolder() { if (!guard()) return; router.push('/folder-create'); track('首页', '新建资料夹') }
function goInput(scene) { if (!guard()) return; router.push(`/package-input?scene=${encodeURIComponent(scene)}`); track('首页', '场景点击', scene) }
function goWriteOff(asset) { if (!guard()) return; router.push(`/write-off?id=${asset.id}`) }
function goEvidence(asset) { if (!guard()) return; router.push(`/evidence-folder?assetId=${asset.id}`) }
function onCustomScene(name) {
  showCustomScene.value = false
  router.push(`/package-input?scene=${encodeURIComponent(name)}`)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFFFFF; padding-bottom: 70px; }

.nav-bar { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 16px; border-bottom: 1px solid #48A9A6; background: #fff; }
.logo { font-size: 18px; font-weight: bold; color: #245957; }
.nav-icons { display: flex; align-items: center; gap: 10px; }
.icon-dot { width: 16px; height: 16px; background: #48A9A6; border-radius: 50%; }
.icon-avatar { width: 20px; height: 20px; background: #48A9A6; border-radius: 50%; }

.hero { padding: 20px 16px 8px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.hero-icon { margin-bottom: 12px; }
.hero-title { font-size: 18px; font-weight: bold; color: #245957; margin: 0 0 4px; }
.hero-sub { font-size: 13px; color: #638F8D; margin: 0; }
.hero-tag { font-size: 11px; color: #638F8D; margin: 2px 0 0; }

.expire-card { margin: 14px 16px 0; padding: 14px 14px 10px; }
.expire-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor: pointer; }
.expire-title { font-size: 15px; font-weight: bold; color: #245957; }
.arrow-blue { font-size: 22px; font-weight: bold; color: #48A9A6; line-height: 1; }
.expire-item { display: flex; align-items: center; height: 32px; background: #fff; border: 1px solid #48A9A6; border-radius: 6px; padding: 0 10px; margin-bottom: 6px; }
.expire-empty { padding: 16px 0; text-align: center; font-size: 13px; color: #638F8D; }
.expire-info { flex: 1; font-size: 13px; color: #245957; }
.expire-info.urgent { font-weight: bold; }
.btn-writeoff { width: 44px; height: 22px; background: #48A9A6; color: #fff; font-size: 10px; font-weight: bold; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 4px; }
.btn-voucher { width: 44px; height: 22px; background: #fff; color: #48A9A6; font-size: 10px; font-weight: bold; border: 1px solid #48A9A6; border-radius: 6px; display: flex; align-items: center; justify-content: center; }

/* 双层入口 */
.entry-section { margin: 14px 16px 0; display: flex; flex-direction: column; gap: 10px; }
.entry-card { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 14px; cursor: pointer; transition: transform .1s; }
.entry-card:active { transform: scale(0.98); }
.entry-quick { background: #48A9A6; }
.entry-full { background: #fff; border: 1.5px solid #48A9A6; }
.entry-icon { font-size: 28px; flex-shrink: 0; }
.entry-body { flex: 1; }
.entry-title { display: block; font-size: 16px; font-weight: bold; }
.entry-quick .entry-title { color: #fff; }
.entry-full .entry-title { color: #245957; }
.entry-desc { display: block; font-size: 12px; margin-top: 2px; }
.entry-quick .entry-desc { color: rgba(255,255,255,.8); }
.entry-full .entry-desc { color: #638F8D; }
.entry-arrow { font-size: 22px; }
.entry-quick .entry-arrow { color: rgba(255,255,255,.7); }
.entry-full .entry-arrow { color: #48A9A6; }

/* 资产概览行 */
.stats-line { display: flex; justify-content: space-between; align-items: center; margin: 14px 16px 0; padding: 10px 14px; background: #F5FAFA; border: 1px solid #B8E6E1; border-radius: 10px; font-size: 12px; color: #4A7A77; cursor: pointer; }
.stats-line b { color: #245957; }
.stats-arrow { color: #48A9A6; font-weight: bold; }

.card-bar { width: 3px; height: 16px; background: #48A9A6; border-radius: 2px; position: absolute; left: 12px; top: 16px; }
.card-icon { position: absolute; right: 12px; top: 14px; opacity: 0.6; }
.card-title { display: block; font-size: 16px; font-weight: bold; color: #245957; margin: 0 0 8px 10px; }
.evidence-card { margin: 14px 16px 0; padding: 14px 14px 40px; position: relative; cursor: pointer; }
.card-desc-long { font-size: 12px; color: #638F8D; margin: 6px 0 0 10px; line-height: 1.5; }
.link-blue { position: absolute; right: 14px; bottom: 12px; font-size: 12px; font-weight: bold; color: #48A9A6; }

.section-title { display: block; font-size: 13px; font-weight: bold; color: #245957; margin: 16px 16px 10px; }

.scene-tags { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 16px; }
.tag { height: 28px; padding: 0 16px; background: #fff; border: 1px solid #48A9A6; border-radius: 14px; font-size: 12px; color: #245957; display: flex; align-items: center; cursor: pointer; }
.tag:active { background: #B8E6E1; }
.tag-custom { color: #638F8D; width: 100%; justify-content: center; }

.disclaimer { text-align: center; font-size: 10px; color: #638F8D; padding: 20px 16px 8px; }
</style>
