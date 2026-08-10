<!--
  青付安 — 预付消费决策卡 /decision-card
  用户心理驱动设计：结论先行 · 说人话 · 只吵醒该吵的 · 给台阶下
-->
<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="navigateBack">‹ 返回</span>
      <span class="title">消费决策卡</span>
    </div>

    <span v-if="loading" class="loading-text">正在分析你的套餐信息...</span>

    <template v-if="!loading && data.totalPrice">
      <!-- ═══ 结论横幅 ═══ -->
      <div class="verdict" :class="'verdict-' + verdictLevel">
        <div class="verdict-icon">
          <svg v-if="verdictLevel==='green'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <svg v-else-if="verdictLevel==='orange'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FD7E14" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC3545" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="verdict-text">
          <span class="verdict-title">{{ verdictTitle }}</span>
          <span class="verdict-sub">{{ verdictSub }}</span>
        </div>
      </div>

      <!-- ═══ 套餐速览 ═══ -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="s-num">{{ data.unlimited ? '不限次' : (parseInt(data.totalTimes)||0) + '次' }}</span>
          <span class="s-unit">总次数</span>
        </div>
        <div class="summary-div" />
        <div class="summary-item">
          <span class="s-num">¥{{ Number(data.totalPrice).toLocaleString() }}</span>
          <span class="s-unit">总价</span>
        </div>
        <div class="summary-div" />
        <div class="summary-item">
          <span class="s-num">{{ data.noExpiry ? '无期限' : (data.validityMonths||'?') + '月' }}</span>
          <span class="s-unit">有效期</span>
        </div>
        <div class="summary-div" />
        <div class="summary-item">
          <span class="s-num">{{ pricePerUse }}</span>
          <span class="s-unit">{{ data.unlimited ? '元/天' : '元/次' }}</span>
        </div>
      </div>
      <div class="summary-scene">{{ data.scene || '--' }} · {{ data.storeName || '--' }}</div>

      <!-- ═══ 花费算账 ═══ -->
      <div class="section">
        <div class="section-head">
          <svg class="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span class="section-title">你的花费算账</span>
        </div>

        <!-- 单次/日均成本 -->
        <div class="cost-row">
          <span class="cost-label">{{ data.unlimited ? '日均成本' : '单次成本' }}</span>
          <span class="cost-value">{{ costMain }}</span>
          <span class="cost-sub">{{ costExplain }}</span>
        </div>

        <!-- 预算对比 -->
        <div class="cost-row" v-if="budgetCompare.show">
          <span class="cost-label">你的月预算</span>
          <span class="cost-value">¥{{ budgetCompare.monthlyBudget }}</span>
          <span class="cost-sub" :class="budgetCompare.over ? 'text-danger' : 'text-ok'">
            <svg v-if="budgetCompare.over" class="inline-icon warn" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC3545" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <svg v-else class="inline-icon ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28A745" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {{ budgetCompare.msg }}
          </span>
        </div>

        <!-- 频率分析（非无限次） -->
        <div class="cost-row" v-if="!data.unlimited && freqInfo.show">
          <span class="cost-label">消耗节奏</span>
          <span class="cost-value">每周 {{ freqInfo.needed }} 次</span>
          <span class="cost-sub" :class="freqInfo.ok ? 'text-ok' : 'text-danger'">
            <svg v-if="freqInfo.ok" class="inline-icon ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28A745" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else class="inline-icon warn" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC3545" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {{ freqInfo.msg }}
          </span>
        </div>
        <!-- 频率分析（无限次） -->
        <div class="cost-row" v-if="data.unlimited && data.weeklyFreq">
          <span class="cost-label">到店频率</span>
          <span class="cost-value">每周 {{ data.weeklyFreq }} 次</span>
          <span class="cost-sub text-ok">{{ unlimitedFreqMsg }}</span>
        </div>

        <!-- 进度条 -->
        <div class="cost-row" v-if="!data.unlimited && freqInfo.show">
          <span class="cost-label">到期预估</span>
          <div class="progress-wrap">
            <div class="mini-progress">
              <div class="mini-fill" :style="{ width: usagePercent + '%', background: usagePercent >= 70 ? '#28A745' : usagePercent >= 40 ? '#FD7E14' : '#DC3545' }" />
            </div>
            <span class="progress-num">{{ usagePercent }}%</span>
          </div>
          <span class="cost-sub">{{ usageMsg }}</span>
        </div>
        <div class="cost-row" v-if="data.unlimited">
          <span class="cost-label">回本参考</span>
          <span class="cost-value">¥{{ unlimitedMonthly }} / 月</span>
          <span class="cost-sub">以市场均价 ¥50/次计，需到店 {{ unlimitedBreakEven }} 次/周回本</span>
        </div>
      </div>

      <!-- ═══ 需要关注的问题 ═══ -->
      <div class="section" v-if="problems.length">
        <div class="section-head">
          <svg class="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FD7E14" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span class="section-title">需要关注的问题</span>
          <span class="section-badge">{{ problems.length }} 项</span>
        </div>

        <div class="problem-item" v-for="p in problems" :key="p.code" :class="'problem-' + p.level">
          <div class="problem-bar" />
          <div class="problem-body">
            <span class="problem-fact">{{ p.fact }}</span>
            <span class="problem-action">{{ p.action }}</span>
          </div>
        </div>
      </div>

      <!-- ═══ 已通过检查 ═══ -->
      <div class="passed-toggle" v-if="passedCount > 0" @click="showPassed = !showPassed">
        <span>
          <svg class="inline-icon ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          通过 {{ passedCount }} 项检查
        </span>
        <span class="passed-arrow" :class="{ open: showPassed }">›</span>
      </div>
      <div class="passed-list" v-if="showPassed">
        <div class="passed-item" v-for="p in passedItems" :key="p.code">
          <span class="passed-fact">
            <svg class="inline-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {{ p.fact }}
          </span>
        </div>
      </div>

      <!-- ═══ 付款前行动清单 ═══ -->
      <div class="section checklist" v-if="checklist.length">
        <div class="section-head">
          <svg class="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2" stroke-linecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          <span class="section-title">付款前建议你做这些</span>
        </div>
        <div class="check-item" v-for="(item, i) in checklist" :key="i">
          <svg class="check-box" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
          <span class="check-text">{{ item }}</span>
        </div>
      </div>

      <!-- ═══ 底部按钮 ═══ -->
      <div class="bottom">
        <div class="btn-primary" :class="{ dimmed: verdictLevel === 'red' }" @click="confirmAsset">
          {{ verdictLevel === 'red' ? '我已知晓风险，仍要生成资产卡' : '确认录入，生成资产卡' }}
        </div>
        <!-- 内嵌风险维度详情 -->
        <div class="detail-toggle" @click="showDetail = !showDetail">
          <span>{{ showDetail ? '收起' : '展开' }}风险维度详情</span>
          <span class="detail-arrow" :class="{ open: showDetail }">›</span>
        </div>
        <div class="detail-panel" v-if="showDetail">
          <div class="dim-item" v-for="dim in result?.dimensions || []" :key="dim.key">
            <div class="dim-head">
              <span class="dim-name">{{ dim.title }}</span>
              <div class="dim-stars">
                <span class="ds" v-for="i in 5" :key="i" :class="{ on: i <= dim.score }" />
              </div>
            </div>
            <div class="dim-rule" v-for="r in dim.rules" :key="r.code" :class="'dr-' + r.level">
              <span class="dr-text"><span class="dr-dot" :class="'dot-' + r.level"></span>{{ r.layers.fact }}</span>
            </div>
          </div>
        </div>
        <div class="btn-back" :class="{ strong: verdictLevel === 'red' }" @click="navigateBack">
          {{ verdictLevel === 'red' ? '← 返回修改套餐信息' : '返回修改' }}
        </div>
        <span class="disclaimer">本工具仅提供信息管理参考，不涉及资金托管与线上交易</span>
      </div>
    </template>

    <div v-if="!loading && !data.totalPrice" class="empty">未找到套餐数据，请先录入套餐信息</div>

    <!-- 确认弹窗 -->
    <asset-confirm v-if="showConfirm" :data="data" @confirm="onAssetConfirm" @close="showConfirm = false" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { runAllRules } from '@/common/rules-engine.js'
import { addAsset, addFolder, addFile } from '@/common/storage.js'
import { track } from '@/common/analytics.js'
import AssetConfirm from '@/components/asset-confirm/index.vue'

const router = useRouter()
const data = ref({})
const loading = ref(true)
const result = ref(null)
const showConfirm = ref(false)
const showPassed = ref(false)
const showDetail = ref(false)

onMounted(() => {
  const raw = sessionStorage.getItem('qf_package_data')
  if (raw) {
    try { data.value = JSON.parse(raw) } catch (e) { data.value = {} }
  }
  if (data.value && data.value.totalPrice) {
    setTimeout(() => {
      result.value = runAllRules(data.value)
      loading.value = false
    }, 600)
  } else {
    loading.value = false
  }
})

// ── 结论横幅 ──
const verdictLevel = computed(() => {
  if (!result.value) return 'green'
  const h = result.value.grade.highCount
  const m = result.value.grade.mediumCount
  if (h >= 3) return 'red'
  if (h >= 1 || m >= 3) return 'orange'
  return 'green'
})
const verdictTitle = computed(() => {
  if (verdictLevel.value === 'red') return '建议谨慎决策'
  if (verdictLevel.value === 'orange') return '有些地方需要核实'
  return '看起来还不错'
})
const verdictSub = computed(() => {
  if (!result.value) return ''
  const h = result.value.grade.highCount
  const m = result.value.grade.mediumCount
  const parts = []
  if (h) parts.push(h + ' 项高风险')
  if (m) parts.push(m + ' 项中风险')
  if (!parts.length) return '未发现明显风险，可以放心'
  return parts.join(' · ') + ' · 建议核实后再付款'
})

// ── 套餐速览 ──
const pricePerUse = computed(() => {
  const p = Number(data.value.totalPrice) || 0
  if (data.value.unlimited) {
    const m = parseFloat(data.value.validityMonths) || 12
    return '¥' + (p / (m * 30)).toFixed(0)
  }
  const t = parseInt(data.value.totalTimes) || 1
  return '¥' + Math.round(p / t)
})

// ── 花费算账 ──
const costMain = computed(() => {
  const p = Number(data.value.totalPrice) || 0
  if (data.value.unlimited) return '¥' + (p / ((parseFloat(data.value.validityMonths) || 12) * 30)).toFixed(1)
  const t = parseInt(data.value.totalTimes) || 1
  return '¥' + (p / t).toFixed(1)
})
const costExplain = computed(() => {
  const p = Number(data.value.totalPrice) || 0
  if (data.value.unlimited) return '总价 ¥' + p.toLocaleString() + ' ÷ ' + (parseFloat(data.value.validityMonths) || 12) + '个月 ÷ 30天'
  const t = parseInt(data.value.totalTimes) || 1
  return '总价 ¥' + p.toLocaleString() + ' ÷ ' + t + ' 次'
})

const budgetCompare = computed(() => {
  const monthlyBudget = parseFloat(data.value.monthlyBudget) || 0
  if (!monthlyBudget) return { show: false }
  const p = Number(data.value.totalPrice) || 0
  const m = parseFloat(data.value.validityMonths) || 12
  if (data.value.unlimited) {
    const monthlyCost = p / m
    const over = monthlyCost > monthlyBudget
    return {
      show: true,
      monthlyBudget: monthlyBudget.toLocaleString(),
      over,
      msg: over
        ? `月均 ¥${Math.round(monthlyCost).toLocaleString()}，超出预算 ¥${Math.round(monthlyCost - monthlyBudget).toLocaleString()}`
        : `月均 ¥${Math.round(monthlyCost).toLocaleString()}，在预算范围内`
    }
  }
  const t = parseInt(data.value.totalTimes) || 1
  const unitCost = p / t
  const perWeekBudget = monthlyBudget / 4
  const over = unitCost > perWeekBudget
  return {
    show: true,
    monthlyBudget: monthlyBudget.toLocaleString(),
    over,
    msg: over
      ? `单次超出预算上限 ¥${Math.round(perWeekBudget)}，贵了约 ¥${Math.round(unitCost - perWeekBudget)}`
      : `单次在预算 ¥${Math.round(perWeekBudget)} 以内，价格合适`
  }
})

const freqInfo = computed(() => {
  const times = parseInt(data.value.totalTimes) || 0
  const months = parseFloat(data.value.validityMonths) || 12
  const freq = parseFloat(data.value.weeklyFreq) || 0
  if (!times || !months) return { show: false }
  const needed = (times / (months * 4.33)).toFixed(1)
  if (!freq) return { show: true, needed, ok: true, msg: '填写每周计划到店次数可看是否来得及用完' }
  const ok = freq >= parseFloat(needed)
  return {
    show: true, needed,
    ok,
    msg: ok ? `你计划每周 ${freq} 次，节奏合适` : `你计划每周 ${freq} 次，但需要 ${needed} 次才用得完`
  }
})

const usagePercent = computed(() => {
  const times = parseInt(data.value.totalTimes) || 0
  const months = parseFloat(data.value.validityMonths) || 12
  const freq = parseFloat(data.value.weeklyFreq) || 0
  if (!times || !months || !freq) return 0
  const canUse = Math.round(freq * 4.33 * months)
  return Math.min(100, Math.round(canUse / times * 100))
})
const usageMsg = computed(() => {
  if (usagePercent.value >= 90) return '按计划基本能消耗完'
  if (usagePercent.value >= 60) return '可能用不完，建议适当提高频率'
  return '频率偏低，到期可能浪费不少'
})

const unlimitedMonthly = computed(() => {
  const p = Number(data.value.totalPrice) || 0
  const m = parseFloat(data.value.validityMonths) || 12
  return Math.round(p / m).toLocaleString()
})
const unlimitedBreakEven = computed(() => {
  const p = Number(data.value.totalPrice) || 0
  const m = parseFloat(data.value.validityMonths) || 12
  return Math.ceil(p / 50 / (m * 4.33))
})
const unlimitedFreqMsg = computed(() => {
  const freq = parseFloat(data.value.weeklyFreq) || 0
  if (!freq) return '填写到店频率后可看回本分析'
  if (freq >= unlimitedBreakEven.value) return '频率达标，可以值回票价'
  return '频率可能不足以回本'
})

// ── 问题列表 ──
const problems = computed(() => {
  if (!result.value) return []
  return result.value.risks
    .filter(r => r.level === 'high' || r.level === 'medium')
    .sort((a, b) => (a.level === 'high' ? -1 : 1))
    .map(r => ({
      code: r.code,
      level: r.level,
      fact: r.layers.fact,
      action: r.layers.action || '建议核实后再做决定'
    }))
})

const passedItems = computed(() => {
  if (!result.value) return []
  return result.value.risks
    .filter(r => r.level === 'low' || r.level === 'none')
    .map(r => ({
      code: r.code,
      fact: r.layers.fact
    }))
})
const passedCount = computed(() => passedItems.value.length)

// ── 行动清单 ──
const checklist = computed(() => {
  if (!result.value) return []
  const actions = result.value.risks
    .filter(r => r.level === 'high')
    .map(r => r.layers.action)
    .filter(Boolean)
  // 去重
  return [...new Set(actions)]
})

// ── 导航 ──
function navigateBack() {
  if (data.value && data.value.totalPrice) {
    sessionStorage.setItem('qf_draft_back', JSON.stringify(data.value))
  }
  router.push('/package-input')
}
function confirmAsset() { showConfirm.value = true }

function onAssetConfirm() {
  track('决策卡', '确认生成资产', data.value.scene, data.value.totalPrice)
  const asset = addAsset({
    scene: data.value.scene,
    name: (data.value.storeName || '') + '·套餐',
    totalPrice: parseFloat(data.value.totalPrice),
    totalTimes: data.value.unlimited ? 999 : (parseInt(data.value.totalTimes) || 0),
    validityMonths: parseFloat(data.value.validityMonths) || 12,
    weeklyFreq: parseFloat(data.value.weeklyFreq) || 0,
    monthlyBudget: parseFloat(data.value.monthlyBudget) || 0,
    storeName: data.value.storeName || '',
    contractName: data.value.contractName || '',
    payeeName: data.value.payeeName || '',
    refundRule: data.value.refundRule || '',
    transferRule: data.value.transferRule || '',
    pauseRule: data.value.pauseRule || '',
    unlimited: !!data.value.unlimited,
    noExpiry: !!data.value.noExpiry,
    giftTimes: parseInt(data.value.giftTimes) || 0,
    usedTimes: 0, status: 'active'
  })
  const folder = addFolder({
    assetId: asset.id,
    name: (data.value.storeName || '资产') + ' · ' + (data.value.scene || '') + ' 凭证',
    note: '自动创建'
  })
  let imgs = data.value.images || []
  if (!imgs.length) {
    try { const raw = localStorage.getItem('qf_package_images'); if (raw) imgs = JSON.parse(raw) } catch(e) {}
  }
  imgs.forEach(img => {
    addFile({
      folderId: folder.id,
      name: img.name,
      type: img.dataUrl ? 'image' : 'file',
      size: img.size ? (img.size > 1048576 ? (img.size / 1048576).toFixed(1) + 'MB' : (img.size / 1024).toFixed(1) + 'KB') : '--',
      materialType: img.materialLabel || '',
      dataUrl: img.dataUrl || ''
    })
  })
  sessionStorage.removeItem('qf_package_data')
  localStorage.removeItem('qf_package_images')
  showConfirm.value = false
  window.__toast?.('资产卡已创建，可在资产列表中查看')
  router.replace('/asset-list')
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5FAFA; padding-bottom: 40px; }
.nav-bar { display: flex; align-items: center; height: 44px; background: #fff; padding: 0 16px; border-bottom: 1px solid #48A9A6; position: relative; }
.back { font-size: 15px; color: #48A9A6; cursor: pointer; z-index: 1; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 17px; font-weight: bold; color: #245957; }
.loading-text { display: block; text-align: center; padding: 40px 16px; font-size: 14px; color: #638F8D; }
.empty { text-align: center; padding: 80px 16px; font-size: 14px; color: #638F8D; }

/* ── 结论横幅 ── */
.verdict { margin: 12px 16px; padding: 16px; border-radius: 14px; display: flex; align-items: center; gap: 12px; }
.verdict-green { background: #E8F5F0; border: 1.5px solid #48A9A6; }
.verdict-orange { background: #FFF8EE; border: 1.5px solid #FD7E14; }
.verdict-red { background: #FFF0F0; border: 1.5px solid #DC3545; }
.verdict-icon { flex-shrink: 0; }
.verdict-title { display: block; font-size: 18px; font-weight: bold; color: #245957; }
.verdict-sub { display: block; font-size: 12px; color: #4A7A77; margin-top: 2px; }
.verdict-red .verdict-title { color: #A71D2A; }
.verdict-red .verdict-sub { color: #DC3545; }
.verdict-orange .verdict-title { color: #C85D00; }

/* ── 套餐速览 ── */
.summary-bar { display: flex; align-items: center; margin: 4px 16px; padding: 12px; background: #fff; border: 1px solid #48A9A6; border-radius: 12px; }
.summary-item { flex: 1; text-align: center; }
.s-num { display: block; font-size: 17px; font-weight: bold; color: #245957; }
.s-unit { display: block; font-size: 10px; color: #638F8D; margin-top: 1px; }
.summary-div { width: 0.5px; height: 28px; background: #B8E6E1; }
.summary-scene { text-align: center; font-size: 12px; color: #638F8D; margin-bottom: 8px; }

/* ── 通用区块 ── */
.section { margin: 10px 16px; padding: 16px; background: #fff; border: 1px solid #48A9A6; border-radius: 14px; }
.section-head { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.section-icon { flex-shrink: 0; }
.section-title { font-size: 15px; font-weight: bold; color: #245957; flex: 1; }
.inline-icon { flex-shrink: 0; vertical-align: middle; margin-right: 2px; }
.section-badge { font-size: 11px; padding: 2px 10px; border-radius: 10px; background: #DC3545; color: #fff; font-weight: bold; }

/* ── 花费算账 ── */
.cost-row { display: flex; flex-wrap: wrap; align-items: center; padding: 10px 0; border-bottom: 1px solid #F0F6F6; }
.cost-row:last-child { border-bottom: none; }
.cost-label { font-size: 13px; color: #638F8D; width: 80px; flex-shrink: 0; }
.cost-value { font-size: 16px; font-weight: bold; color: #245957; }
.cost-sub { font-size: 11px; color: #638F8D; width: 100%; margin-top: 2px; padding-left: 80px; }
.text-danger { color: #DC3545; font-weight: bold; }
.text-ok { color: #28A745; }
.progress-wrap { display: flex; align-items: center; gap: 8px; }
.mini-progress { width: 80px; height: 6px; background: #E8E8E8; border-radius: 3px; overflow: hidden; }
.mini-fill { height: 100%; border-radius: 3px; transition: width .4s; }
.progress-num { font-size: 13px; font-weight: bold; color: #245957; }

/* ── 问题列表 ── */
.problem-item { display: flex; gap: 10px; padding: 12px; margin-bottom: 8px; border-radius: 10px; background: #FFF; }
.problem-item:last-child { margin-bottom: 0; }
.problem-high { background: #FFF0F0; border: 1px solid #E8686A; }
.problem-medium { background: #FFF8EE; border: 1px solid #FD7E14; }
.problem-bar { width: 3px; border-radius: 2px; flex-shrink: 0; }
.problem-high .problem-bar { background: #DC3545; }
.problem-medium .problem-bar { background: #FD7E14; }
.problem-body { flex: 1; min-width: 0; }
.problem-fact { display: block; font-size: 13px; color: #245957; line-height: 1.5; font-weight: 600; }
.problem-action { display: block; font-size: 12px; color: #4A7A77; margin-top: 6px; line-height: 1.5; }
.problem-high .problem-action { color: #A71D2A; }

/* ── 已通过 ── */
.passed-toggle { margin: 2px 16px; padding: 12px 16px; background: #fff; border: 1px dashed #B8E6E1; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #48A9A6; cursor: pointer; }
.passed-toggle:active { background: #F5FAFA; }
.passed-arrow { font-size: 16px; transition: transform .2s; }
.passed-arrow.open { transform: rotate(90deg); }
.passed-list { margin: 2px 16px; padding: 10px 16px; background: #F5FAFA; border-radius: 10px; animation: fadeIn .2s; }
@keyframes fadeIn { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
.passed-fact { display: block; font-size: 12px; color: #638F8D; padding: 3px 0; }

/* ── 行动清单 ── */
.checklist { border-color: #48A9A6; }
.check-item { display: flex; gap: 10px; padding: 8px 0; align-items: flex-start; }
.check-box { flex-shrink: 0; margin-top: 1px; }
.check-text { font-size: 13px; color: #245957; line-height: 1.5; }

/* ── 底部 ── */
.bottom { margin: 20px 16px; display: flex; flex-direction: column; gap: 10px; }
.btn-primary {
  height: 48px; background: #48A9A6; color: #fff; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: bold; border: none; cursor: pointer;
}
.btn-primary:active { opacity: 0.85; }
.btn-primary.dimmed { background: #9FD8D2; color: #fff; font-size: 14px; }
.btn-secondary {
  height: 44px; background: #fff; color: #48A9A6; border: 1.5px solid #48A9A6; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: bold; cursor: pointer;
}
.btn-secondary:active { background: #F5FAFA; }
.btn-back {
  height: 40px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #638F8D; cursor: pointer;
}
.btn-back.strong {
  height: 46px; color: #245957; font-weight: bold;
  border: 1.5px solid #245957; border-radius: 10px;
}
.disclaimer { display: block; text-align: center; font-size: 10px; color: #638F8D; padding: 8px 0; }

/* 内嵌风险详情 */
.detail-toggle { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #F5FAFA; border: 1px dashed #B8E6E1; border-radius: 10px; font-size: 13px; color: #48A9A6; cursor: pointer; }
.detail-toggle:active { background: #E8F5F4; }
.detail-arrow { font-size: 16px; transition: transform .2s; }
.detail-arrow.open { transform: rotate(90deg); }
.detail-panel { margin-top: 8px; padding: 12px; background: #fff; border: 1px solid #B8E6E1; border-radius: 10px; animation: fadeIn .2s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.dim-item { margin-bottom: 12px; }
.dim-item:last-child { margin-bottom: 0; }
.dim-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.dim-name { font-size: 13px; font-weight: bold; color: #245957; }
.dim-stars { display: flex; gap: 3px; }
.ds { width: 8px; height: 8px; border-radius: 50%; background: #E0E0E0; }
.ds.on { background: #48A9A6; }
.dim-rule { padding: 4px 0; }
.dr-text { font-size: 11px; color: #638F8D; line-height: 1.4; }
.dr-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.dot-high { background: #DC3545; }
.dot-medium { background: #FD7E14; }
.dot-low, .dot-none { background: #B8E6E1; }
.dr-high .dr-text { color: #DC3545; }
.dr-medium .dr-text { color: #FD7E14; }
</style>
