<!--
  青付安 — 预付消费决策卡 /decision-card
  对应 PRD §4.3 · 线框图 📊 预付消费决策卡-美化版
  16条规则本地运算 · 五维度评分 · 成本测算
-->
<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 信息录入</span>
      <span class="title">预付消费决策卡</span>
    </div>

    <!-- 加载态 -->
    <span v-if="loading" class="loading-text">正在测算15项预付风险指标...</span>

    <template v-if="!loading && result">
      <!-- 套餐摘要 -->
      <div class="card-blue summary">
        <div class="module-header">
          <div class="module-bar" />
          <span class="module-title">套餐基础摘要</span>
        </div>
        <div class="summary-grid">
          <span class="s-label">消费场景</span><span class="s-value">{{ data.scene }}</span>
          <span class="s-label">总价金额</span><span class="s-value">¥{{ Number(data.totalPrice).toLocaleString() }}</span>
          <span class="s-label">总次数</span><span class="s-value">{{ data.totalTimes }} 次</span>
          <span class="s-label">有效期</span><span class="s-value">{{ data.validityMonths }} 个月</span>
        </div>
      </div>

      <!-- 综合风险等级 -->
      <div class="card-blue grade-card">
        <div class="module-header">
          <div class="module-bar" />
          <span class="module-title">综合风险等级</span>
        </div>
        <div class="grade-tags">
          <div class="grade-tag" :style="{ background: '#DC3545' }">高风险项 {{ result.grade.highCount }}</div>
          <div class="grade-tag" :style="{ background: '#FD7E14' }">中风险项 {{ result.grade.mediumCount }}</div>
          <div class="grade-tag" :style="{ background: '#28A745' }">低风险项 {{ 16 - result.grade.highCount - result.grade.mediumCount }}</div>
        </div>
        <span class="grade-note">仅作综合参考，五维度独立评分更精准</span>
      </div>

      <!-- 五维度评分卡片（可折叠） -->
      <div class="card-blue dim-card" v-for="dim in result.dimensions" :key="dim.key">
        <div class="dim-header" @click="toggleDim(dim.key)">
          <span class="dim-title">{{ dim.title }}</span>
          <div class="dim-score">
            <span class="score-label">评分</span>
            <div class="stars">
              <div class="star" v-for="i in 5" :key="i" :class="{ active: i <= dim.score }" />
            </div>
          </div>
          <span class="dim-arrow">{{ expanded[dim.key] ? '▼' : '›' }}</span>
        </div>
        <span class="dim-hint">{{ getDimHint(dim) }}</span>
        <template v-if="expanded[dim.key]">
          <div class="rule-item" v-for="r in dim.rules" :key="r.code"
            :class="{ 'rule-high': r.level === 'high', 'rule-medium': r.level === 'medium' }">
            <span class="rule-code" :class="'level-' + r.level">{{ r.code }} {{ r.level === 'high' ? '●高风险' : r.level === 'medium' ? '●中风险' : '○低风险' }}</span>
            <span class="rule-fact">①风险事实: {{ r.layers.fact }}</span>
            <span class="rule-confirm">②待确认: {{ r.layers.confirm }}</span>
            <span class="rule-explain">③合规说明: {{ r.layers.explain }}</span>
            <span class="rule-action">④行动建议: {{ r.layers.action }}</span>
          </div>
        </template>
      </div>

      <!-- 预付成本测算 -->
      <div class="card-blue cost-card">
        <div class="module-header">
          <div class="module-bar" />
          <span class="module-title">预付成本测算</span>
          <div class="cost-tag">静态参考</div>
        </div>
        <div class="cost-row" v-for="c in ['base','ideal','conservative']" :key="c">
          <span class="cost-label">{{ result.costs[c].label }}</span>
          <span class="cost-value" :class="{ highlight: c === 'ideal' }">¥{{ result.costs[c].value.toFixed(1) }}/次</span>
          <span class="cost-note" v-if="c !== 'base'">{{ c === 'ideal' ? `每周${result.costs[c].freq}次·回本${result.costs[c].months.toFixed(1)}个月` : `每周${result.costs[c].freq}次·回本${result.costs[c].months.toFixed(1)}个月` }}</span>
        </div>
        <span class="expiry-note">按保守频率到期前预计消耗约{{ result.costs.expiry.usageRatio }}%总次数，建议提升使用频次或选择小额套餐</span>
      </div>

      <!-- 综合建议 -->
      <div class="card-light advice-box">
        <span class="advice-text">综合建议：{{ advice }}</span>
      </div>

      <!-- 底部按钮 -->
      <div class="btn-row-bottom">
        <div class="btn-secondary-lg" @click="navigateBack">返回修改</div>
        <div class="btn-secondary-lg" @click="goRiskReport">查看详细风险分析报告</div>
        <div class="btn-primary-lg" @click="confirmAsset">确认录入，生成预付权益记录卡</div>
      </div>

      <span class="disclaimer">本工具仅提供预付消费信息管理与风险参考，不涉及任何资金托管与线上交易服务</span>
    </template>

    <!-- 确认弹窗 -->
    <asset-confirm v-if="showConfirm" :data="data" @confirm="onAssetConfirm" @close="showConfirm = false" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, reactive, computed, onMounted } from 'vue'
import { runAllRules } from '@/common/rules-engine.js'
import { addAsset, addFolder } from '@/common/storage.js'
import { track } from '@/common/analytics.js'
import AssetConfirm from '@/components/asset-confirm/index.vue'

const router = useRouter()
const data = ref({})
const loading = ref(true)
const result = ref(null)
const showConfirm = ref(false)
const expanded = reactive({})

function getDimHint(dim) {
  const high = dim.rules.filter(r => r.level === 'high')
  const medium = dim.rules.filter(r => r.level === 'medium')
  if (!high.length && !medium.length) return '未检测到明显风险项，建议仍仔细核对合同条款'
  if (high.length) return high[0].layers.fact + '。' + high[0].layers.action
  return medium[0].layers.fact + '。' + medium[0].layers.action
}

const advice = computed(() => {
  if (!result.value) return ''
  const h = result.value.grade.highCount
  return h >= 3 ? '价格合理性存疑，合约保障不足，建议与商家补充书面约定后再决策'
    : h >= 1 ? '存在风险项，建议在付款前完成待确认项后再决策'
    : '当前套餐信息较透明，可按需决策'
})

onMounted(() => {
  // 从 sessionStorage 读取套餐录入数据
  const raw = sessionStorage.getItem('qf_package_data')
  if (raw) {
    try {
      data.value = JSON.parse(raw)
      // 保留数据在 sessionStorage，支持从风险报告页返回时恢复
    } catch (e) {
      data.value = {}
    }
  }
  // 如果有数据则执行规则运算
  if (data.value && data.value.totalPrice) {
    setTimeout(() => {
      result.value = runAllRules(data.value)
      loading.value = false
    }, 800)
  } else {
    // 无数据提示
    loading.value = false
  }
})

function toggleDim(key) { expanded[key] = !expanded[key] }

function navigateBack() {
  // 将套餐数据回存 sessionStorage，返回后自动回填表单
  if (data.value && data.value.totalPrice) {
    sessionStorage.setItem('qf_draft_back', JSON.stringify(data.value))
  }
  router.back()
}

function goRiskReport() {
  router.push('/risk-report')
}

function confirmAsset() { showConfirm.value = true }

function onAssetConfirm() {
  track('决策卡', '确认生成资产', data.value.scene, data.value.totalPrice)
  addAsset({
    scene: data.value.scene,
    name: data.value.storeName + '·' + (data.value.packageName || '套餐'),
    totalPrice: parseFloat(data.value.totalPrice),
    totalTimes: parseInt(data.value.totalTimes),
    validityMonths: parseInt(data.value.validityMonths),
    weeklyFreq: parseFloat(data.value.weeklyFreq),
    monthlyBudget: parseFloat(data.value.monthlyBudget),
    storeName: data.value.storeName,
    contractName: data.value.contractName,
    payeeName: data.value.payeeName,
    refundRule: data.value.refundRule || '',
    transferRule: data.value.transferRule || '',
    pauseRule: data.value.pauseRule || '',
    usedTimes: 0,
    status: 'active'
  })
  sessionStorage.removeItem('qf_package_data')
  showConfirm.value = false
  router.replace('/asset-list')
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #FFFFFF; padding-bottom: 24px; }
.nav-bar { display: flex; align-items: center; height: 44px; background: #fff; padding: 0 16px; border-bottom: 0.5px solid #48A9A6; }
.back { font-size: 15px; color: #48A9A6; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; }
.loading-text { text-align: center; font-size: 11px; color: #638F8D; padding: 8px; }

.card-blue { background: #fff; border: 1px solid #48A9A6; border-radius: 12px; padding: 14px; margin: 8px 16px 0; }
.module-header { display: flex; align-items: center; margin-bottom: 8px; }
.module-bar { width: 3px; height: 16px; background: #48A9A6; border-radius: 1.5px; margin-right: 8px; }
.module-title { font-size: 16px; font-weight: bold; color: #245957; }

.summary-grid { display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; }
.s-label { font-size: 12px; color: #638F8D; }
.s-value { font-size: 12px; color: #245957; }

.grade-tags { display: flex; gap: 8px; margin-top: 8px; }
.grade-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; color: #fff; font-weight: bold; }
.grade-note { display: block; font-size: 10px; color: #638F8D; margin-top: 6px; }

.dim-header { display: flex; align-items: center; cursor: pointer; }
.dim-title { flex: 1; font-size: 16px; font-weight: bold; color: #245957; }
.dim-score { display: flex; align-items: center; margin-right: 8px; }
.score-label { font-size: 12px; color: #638F8D; margin-right: 4px; }
.stars { display: flex; gap: 4px; }
.star { width: 10px; height: 10px; border-radius: 50%; background: #48A9A6; border: 1px solid #999; }
.star.active { background: #48A9A6; border-color: #48A9A6; }
.dim-arrow { font-size: 9px; color: #48A9A6; }
.dim-hint { display: block; font-size: 12px; color: #638F8D; margin: 4px 0 8px; }

.rule-item { padding: 10px; margin-bottom: 6px; border-radius: 8px; background: #B8E6E1; border: 1px solid #48A9A6; }
.rule-item.rule-high { background: #FFF0F0; border-color: #DC3545; }
.rule-high .rule-code { color: #DC3545; }
.rule-item.rule-medium { background: #FFF5F5; border-color: #E8686A; }
.rule-medium .rule-code { color: #FD7E14; }
.rule-code { display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; }
.rule-code.level-low { color: #638F8D; }
.rule-fact, .rule-confirm, .rule-explain, .rule-action { display: block; font-size: 10px; color: #245957; margin-top: 2px; }

.cost-card { position: relative; }
.cost-tag { position: absolute; top: 14px; right: 14px; padding: 2px 8px; background: #B8E6E1; border-radius: 6px; font-size: 10px; color: #48A9A6; }
.cost-row { display: flex; flex-wrap: wrap; align-items: baseline; margin: 6px 0; }
.cost-label { font-size: 13px; color: #638F8D; width: 120px; }
.cost-value { font-size: 15px; color: #245957; font-weight: bold; }
.cost-value.highlight { color: #48A9A6; }
.cost-note { font-size: 10px; color: #638F8D; width: 100%; }
.expiry-note { display: block; font-size: 10px; color: #638F8D; margin-top: 6px; line-height: 1.5; }

.advice-box { margin: 8px 16px 0; padding: 14px; }
.advice-text { font-size: 11px; color: #48A9A6; line-height: 1.6; }

.btn-row-bottom { display: flex; flex-direction: column; gap: 10px; margin: 20px 16px; }
.btn-primary-lg {
  display: flex; align-items: center; justify-content: center;
  height: 48px; background: #48A9A6; color: #fff;
  border-radius: 8px; font-size: 16px; font-weight: bold;
  border: none; cursor: pointer;
}
.btn-primary-lg:active { opacity: 0.85; }
.btn-secondary-lg {
  display: flex; align-items: center; justify-content: center;
  height: 48px; background: #fff; color: #48A9A6;
  border: 1px solid #48A9A6; border-radius: 8px;
  font-size: 16px; font-weight: bold; cursor: pointer;
}
.btn-secondary-lg:active { background: #F5F8FF; }
.flex-1 { flex: 1; }

.disclaimer { text-align: center; font-size: 10px; color: #638F8D; padding: 12px 16px 32px; }
</style>
