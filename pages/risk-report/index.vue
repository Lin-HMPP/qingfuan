<!-- 详细风险分析报告 · 对应PRD §4.4 · 线框图 📊 详细风险分析报告-美化版 -->
<template>
  <div class="page">
    <div class="nav-bar"><span class="back" @click="navigateBack">‹ 决策卡</span><span class="title">详细风险分析报告</span></div>
    <!-- 套餐摘要 -->
    <div class="card-gray summary-box">
      <div class="sum-left">
        <span class="s-label">消费场景</span><span class="s-value">{{ data.scene }}</span>
        <span class="s-label">套餐名称</span><span class="s-value">{{ data.storeName || '--' }}</span>
        <span class="s-label">总价金额</span><span class="s-value bold">¥{{ (Number(data.totalPrice) || 0).toLocaleString() }}</span>
        <span class="s-label">测算日期</span><span class="s-value">{{ today }}</span>
      </div>
      <div class="sum-divider" />
      <div class="sum-right">
        <span class="s-label">总体风险</span>
        <div class="risk-tag" :style="{ background: result ? result.grade.color : '#999' }">{{ result ? result.grade.label : '--' }}</div>
        <span class="risk-hint">高风险{{ result ? result.grade.highCount : 0 }}项 · 中风险{{ result ? result.grade.mediumCount : 0 }}项 · 详见下方维度分析</span>
      </div>
    </div>

    <!-- 五大风险板块（来自规则引擎） -->
    <div class="card-blue risk-block" v-for="dim in dimensions" :key="dim.key">
      <div class="block-header">
        <span class="block-title">{{ dim.title }}</span>
        <div class="block-level" :style="{ background: dimLevelColor(dim) }">{{ dimLevelLabel(dim) }}</div>
      </div>
      <span class="block-sub">命中规则（评分 {{ dim.score }}/5）</span>
      <div v-for="r in dim.rules" :key="r.code">
        <span class="rule-point" :class="r.level === 'high' ? 'point-high' : 'point-normal'">
          {{ r.level === 'high' ? '●' : '○' }} {{ r.title }}: {{ r.layers.fact }}
        </span>
      </div>
      <span class="block-action">行动建议: {{ dim.rules[0]?.layers.action || '请参考决策卡详情' }}</span>
    </div>

    <!-- 深度成本测算（普通模式，来自规则引擎） -->
    <div class="card-blue cost-section" v-if="result && !data.unlimited">
      <span class="section-title">深度成本测算</span>
      <div class="scenario-row">
        <div class="scenario-box">
          <span class="sc-title">乐观情景</span>
          <span class="sc-detail">每周使用 {{ result.costs.ideal.freq }} 次</span>
          <span class="sc-detail">单次成本 ¥{{ result.costs.ideal.value.toFixed(1) }}</span>
          <span class="sc-detail">预估回本 {{ result.costs.ideal.months.toFixed(1) }} 个月</span>
          <span class="sc-tag" :class="result.costs.ideal.months < (data.validityMonths || 12) ? 'good' : 'bad'">
            {{ result.costs.ideal.months < (data.validityMonths || 12) ? '✓ 划算' : '✗ 不划算' }}
          </span>
        </div>
        <div class="scenario-box">
          <span class="sc-title">悲观情景</span>
          <span class="sc-detail">每周使用 {{ result.costs.conservative.freq }} 次</span>
          <span class="sc-detail">单次成本 ¥{{ result.costs.conservative.value.toFixed(1) }}</span>
          <span class="sc-detail">预估回本 {{ result.costs.conservative.months.toFixed(1) }} 个月</span>
          <span class="sc-tag bad">✗ 不划算</span>
        </div>
      </div>
      <span class="progress-label">到期使用进度预估</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: result.costs.expiry.usageRatio + '%' }" />
      </div>
      <span class="progress-text">{{ result.costs.expiry.usageRatio }}%</span>
      <span class="progress-note">{{ result.costs.expiry.suggestion }}</span>
    </div>

    <!-- 充卡价值分析（无限次模式） -->
    <div class="card-blue cost-section" v-if="result && data.unlimited">
      <span class="section-title">充卡价值分析</span>
      <div class="value-metrics">
        <div class="metric-item">
          <span class="metric-value">¥{{ result.costs.daily.value.toFixed(1) }}</span>
          <span class="metric-label">日均成本</span>
        </div>
        <div class="metric-divider" />
        <div class="metric-item">
          <span class="metric-value">¥{{ Math.round(result.costs.monthly.value).toLocaleString() }}</span>
          <span class="metric-label">月均成本</span>
        </div>
        <div class="metric-divider" />
        <div class="metric-item">
          <span class="metric-value">{{ result.costs.breakEven.estimatedTotalVisits }} 次</span>
          <span class="metric-label">预估总到店</span>
        </div>
      </div>

      <div class="breakeven-box">
        <span class="be-title">回本分析</span>
        <span class="be-detail">以市场单次均价 ¥{{ result.costs.breakEven.marketPerVisit }} 为参考</span>
        <span class="be-detail">需每周到店 ≥ <b>{{ result.costs.breakEven.visitsPerWeek }}</b> 次才能值回票价</span>
        <span class="be-detail">你计划每周到店 <b>{{ result.costs.breakEven.weeklyFreq }}</b> 次</span>
        <span class="be-detail">理想单次成本约 <b>¥{{ result.costs.breakEven.idealPerVisitCost.toFixed(1) }}</b></span>
        <div class="be-verdict" :class="result.costs.breakEven.visitsPerWeek <= result.costs.breakEven.weeklyFreq ? 'good' : 'warn'">
          {{ result.costs.breakEven.visitsPerWeek <= result.costs.breakEven.weeklyFreq ? '✓ 频率达标，充卡划算' : '! 频率不足，可能难以回本' }}
        </div>
      </div>

      <span class="progress-label">回本进度评估</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: Math.min(100, result.costs.expiry.usageRatio) + '%' }" />
      </div>
      <span class="progress-text">{{ Math.min(100, result.costs.expiry.usageRatio) }}%</span>
      <span class="progress-note">{{ result.costs.expiry.suggestion }}</span>
    </div>

    <div class="btn-row">
      <div class="btn-secondary-lg" @click="navigateBack">返回决策卡</div>
      <div class="btn-primary-lg" @click="confirmAsset">确认生成资产</div>
    </div>
    <span class="disclaimer">本工具仅提供预付消费信息管理与风险参考，不涉及任何资金托管与线上交易服务</span>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { runAllRules } from '@/common/rules-engine.js'
import { addAsset, addFolder, addFile, MATERIAL_LABEL_MAP } from '@/common/storage.js'

const router = useRouter()
const data = ref({})
const result = ref(null)
const today = new Date().toISOString().slice(0, 10)

const dimensions = computed(() => result.value?.dimensions || [])

function dimLevelColor(dim) {
  if (dim.score >= 4) return '#28A745'
  if (dim.score >= 2) return '#FD7E14'
  return '#DC3545'
}
function dimLevelLabel(dim) {
  if (dim.score >= 4) return '低风险'
  if (dim.score >= 2) return '中风险'
  return '高风险'
}

onMounted(() => {
  const raw = sessionStorage.getItem('qf_package_data')
  if (raw) {
    try { data.value = JSON.parse(raw) } catch (e) { data.value = {} }
  }
  if (data.value && data.value.totalPrice) {
    result.value = runAllRules(data.value)
  }
})

function navigateBack() { router.push('/decision-card') }
function confirmAsset() {
  if (data.value && data.value.totalPrice) {
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
    // 自动创建同名证据资料夹
    const folder = addFolder({ assetId: asset.id, name: (data.value.storeName || '资产') + '·凭证', note: '自动创建' })
    // 同步套餐录入页上传的材料到证据夹
    const images = data.value.images || []
    images.forEach(img => {
      // 判断是否为图片：有 dataUrl 且 dataUrl 以 data:image 开头
      const isImage = img.dataUrl && img.dataUrl.startsWith('data:image')
      const fileRecord = {
        folderId: folder.id,
        name: img.name,
        type: isImage ? 'image' : (img.name || '').split('.').pop() || 'file',
        size: img.size > 1048576 ? (img.size / 1048576).toFixed(1) + 'MB' : (img.size / 1024).toFixed(1) + 'KB',
        materialType: MATERIAL_LABEL_MAP[img.materialLabel] || '',
        dataUrl: img.dataUrl || '',
        mimeType: isImage ? 'image/' + ((img.name || '').split('.').pop() || 'png') : 'application/octet-stream'
      }
      addFile(fileRecord)
    })
  }
  sessionStorage.removeItem('qf_package_data')
  router.replace('/asset-list')
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #FFFFFF; padding-bottom: 80px; }
.nav-bar { display: flex; align-items: center; height: 44px; background: #fff; padding: 0 16px; border-bottom: 0.5px solid #48A9A6; }
.back { font-size: 15px; color: #48A9A6; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; }
.card-gray { margin: 8px 16px; padding: 14px; background: #F7F7F7; border-radius: 12px; display: flex; }
.sum-left { flex: 1; }
.s-label { font-size: 12px; color: #638F8D; display: block; }
.s-value { font-size: 12px; color: #245957; }
.s-value.bold { font-weight: bold; }
.sum-divider { width: 0.5px; background: #999; margin: 0 14px; }
.sum-right { text-align: center; display: flex; flex-direction: column; justify-content: center; padding-left: 12px; }
.risk-tag { padding: 5px 14px; border-radius: 6px; color: #fff; font-size: 11px; font-weight: bold; display: inline-block; margin: 4px 0; }
.risk-hint { display: block; font-size: 10px; color: #638F8D; }
.card-blue { margin: 8px 16px; padding: 14px; background: #fff; border: 1px solid #48A9A6; border-radius: 12px; }
.block-header { display: flex; justify-content: space-between; align-items: center; }
.block-title { font-size: 16px; font-weight: bold; }
.block-level { padding: 4px 10px; border-radius: 6px; color: #fff; font-size: 11px; font-weight: bold; }
.block-sub { display: block; font-size: 12px; font-weight: bold; color: #245957; margin: 8px 0 4px; }
.rule-point { display: block; font-size: 11px; padding: 2px 0; color: #638F8D; }
.point-high { color: #DC3545; font-weight: bold; }
.block-action { display: block; font-size: 11px; color: #638F8D; margin-top: 8px; }
.cost-section { margin-top: 8px; }
.section-title { font-size: 16px; font-weight: bold; }
.scenario-row { display: flex; gap: 8px; margin: 10px 0; }
.scenario-box { flex: 1; padding: 12px; background: #B8E6E1; border-radius: 8px; }
.sc-title { font-size: 13px; font-weight: bold; display: block; }
.sc-detail { font-size: 11px; color: #638F8D; display: block; margin-top: 2px; }
.sc-tag { font-size: 11px; font-weight: bold; }
.sc-tag.good { color: #28A745; }
.sc-tag.bad { color: #DC3545; }
.progress-label { font-size: 13px; font-weight: bold; display: block; margin-top: 6px; }
.progress-bar { height: 14px; background: #E6E6E6; border-radius: 7px; margin: 4px 0; }
.progress-fill { height: 100%; background: #28A745; border-radius: 7px; }
.progress-text { font-size: 11px; font-weight: bold; color: #28A745; }
.progress-note { font-size: 10px; color: #638F8D; display: block; }
.btn-row { display: flex; gap: 10px; margin: 20px 16px; }
.btn-primary-lg {
  display: flex; align-items: center; justify-content: center;
  height: 48px; background: #48A9A6; color: #fff;
  border-radius: 8px; font-size: 16px; font-weight: bold; border: none; cursor: pointer;
  flex: 1;
}
.btn-secondary-lg {
  display: flex; align-items: center; justify-content: center;
  height: 48px; background: #fff; color: #48A9A6;
  border: 1px solid #48A9A6; border-radius: 8px;
  font-size: 16px; font-weight: bold; cursor: pointer;
  flex: 1;
}
.flex-1 { flex: 1; }
.disclaimer { text-align: center; font-size: 10px; color: #638F8D; padding: 12px 16px 32px; }
.page { padding-bottom: 24px; }

/* 充卡价值分析（无限次模式） */
.value-metrics { display: flex; align-items: center; margin: 12px 0; padding: 12px; background: #B8E6E1; border-radius: 8px; }
.metric-item { flex: 1; text-align: center; }
.metric-value { display: block; font-size: 20px; font-weight: bold; color: #245957; }
.metric-label { display: block; font-size: 11px; color: #638F8D; margin-top: 2px; }
.metric-divider { width: 1px; height: 36px; background: #48A9A6; opacity: 0.4; }
.breakeven-box { padding: 12px; margin: 10px 0; background: #F5FAFA; border: 1px dashed #48A9A6; border-radius: 8px; }
.be-title { display: block; font-size: 14px; font-weight: bold; color: #245957; margin-bottom: 6px; }
.be-detail { display: block; font-size: 12px; color: #4A7A77; line-height: 1.8; }
.be-detail b { color: #245957; }
.be-verdict { margin-top: 10px; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; text-align: center; }
.be-verdict.good { background: #B8E6E1; color: #245957; }
.be-verdict.warn { background: #FFF3CD; color: #856404; }
</style>
