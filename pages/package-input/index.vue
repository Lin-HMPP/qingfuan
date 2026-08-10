<!--
  青付安 — 套餐信息录入页 /package-input
  对应 PRD §4.2 · 线框图 📝 套餐信息录入-美化版
-->
<template>
  <div class="page">
    <!-- 顶栏 -->
    <div class="nav-bar">
      <span class="back" @click="goBack">‹ 首页</span>
      <span class="title">套餐信息录入</span>
    </div>

    <!-- 场景切换 -->
    <div class="scene-switch" @click="showScenePicker = true">
      <span>当前场景：{{ scene }}</span>
      <span class="switch-link">切换场景 →</span>
    </div>

    <!-- 进度条 -->
    <div class="progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (progress / 5 * 100) + '%' }" />
      </div>
      <span class="progress-text">已完成 {{ progress }}/5 模块</span>
    </div>

    <!-- 模块一：套餐基础费用 -->
    <div class="card-blue module">
      <div class="module-header">
        <div class="module-bar" />
        <span class="module-title">一、套餐基础费用</span>
      </div>

      <span class="label"><span class="star">*</span><span class="label-text">套餐总价（元）</span></span>
      <input class="input-blue" v-model="form.totalPrice" type="text" inputmode="decimal" placeholder="输入实付总金额" />

      <span class="label"><span class="star">*</span><span class="label-text">总服务次数</span><span class="label-hint">（不含赠课次数）</span></span>
      <div class="no-expiry-toggle" @click="toggleUnlimited()" :class="{ active: form.unlimited }">
        <div class="toggle-dot"></div>
        <span class="toggle-label">无限次（充卡 / 不限次数）</span>
      </div>
      <div v-if="!form.unlimited">
        <input class="input-blue" v-model="form.totalTimes" type="number" placeholder="不含赠课次数" />
        <span class="label"><span class="label-text">赠送次数/赠课</span></span>
        <input class="input-blue" v-model="form.giftTimes" type="number" placeholder="无赠送填0" />
      </div>
      <span class="validity-display" v-if="form.unlimited">
        充卡模式 · 不限次数，在有效期内任意到店
      </span>

      <span class="label"><span class="star">*</span><span class="label-text">服务有效期限</span></span>
      <div class="no-expiry-toggle" @click="toggleNoExpiry()" :class="{ active: form.noExpiry }">
        <div class="toggle-dot"></div>
        <span class="toggle-label">没有固定期限（次卡）</span>
      </div>
      <div class="validity-row" v-if="!form.noExpiry">
        <input class="input-blue validity-input" v-model="form.validityValue" type="number" placeholder="输入数字" />
        <div class="unit-tabs">
          <div class="unit-tab" :class="{ active: form.validityUnit === 'day' }" @click="form.validityUnit = 'day'">日</div>
          <div class="unit-tab" :class="{ active: form.validityUnit === 'month' }" @click="form.validityUnit = 'month'">月</div>
          <div class="unit-tab" :class="{ active: form.validityUnit === 'quarter' }" @click="form.validityUnit = 'quarter'">季度</div>
        </div>
      </div>
      <span class="validity-display" v-if="form.noExpiry">
        次卡 · 无固定使用期限，用完即止
      </span>
      <span class="validity-display" v-else-if="form.validityValue">
        有效期：{{ form.validityValue }}{{ unitLabel }}
      </span>

      <!-- 实时成本测算 -->
      <div class="cost-preview" v-if="totalPrice && totalTimes">
        当前基础单次成本 ≈ {{ baseUnitCost }}
      </div>
    </div>

    <!-- 模块二：个人使用规划（可折叠） -->
    <div class="card-blue module-fold">
      <div class="fold-header" @click="showModule2 = !showModule2">
        <span class="fold-title">二、个人使用规划</span>
        <span class="fold-status" v-if="!showModule2">{{ module2Status }}</span>
        <span class="fold-arrow">{{ showModule2 ? '▼' : '›' }}</span>
      </div>
      <div v-if="showModule2" @click.stop>
        <span class="label"><span class="star">*</span><span class="label-text">每月可支配预付预算</span></span>
        <input class="input-blue" v-model="form.monthlyBudget" type="text" inputmode="decimal" placeholder="每月能用于办卡的支出上限" />

        <span class="label"><span class="star">*</span><span class="label-text">预计每周到店使用次数</span></span>
        <input class="input-blue" v-model="form.weeklyFreq" type="text" inputmode="decimal" placeholder="如每周2次" />

        <div v-if="freqEstimate.show" class="freq-info" :class="freqEstimate.risk ? 'freq-warn' : 'freq-ok'">
          {{ freqEstimate.msg }}
        </div>
      </div>
    </div>

    <!-- 模块三：签约&收款主体信息（可折叠） -->
    <div class="card-blue module-fold">
      <div class="fold-header" @click="showModule3 = !showModule3">
        <span class="fold-title">三、签约&收款主体信息</span>
        <span class="fold-status" v-if="!showModule3">{{ module3Status }}</span>
        <span class="fold-arrow">{{ showModule3 ? '▼' : '›' }}</span>
      </div>
      <div v-if="showModule3" @click.stop>
        <span class="label"><span class="star">*</span><span class="label-text">门店宣传名称</span></span>
        <input class="input-blue" v-model="form.storeName" placeholder="门店招牌、海报上的名称" />

        <span class="label"><span class="star">*</span><span class="label-text">合同签约主体名称</span></span>
        <input class="input-blue" v-model="form.contractName" placeholder="合同盖章公司名" />

        <span class="label"><span class="star">*</span><span class="label-text">收款账户/商家收款名</span></span>
        <input class="input-blue" v-model="form.payeeName" placeholder="微信/支付宝收款显示名称" />
      </div>
    </div>

    <!-- 模块四：套餐履约规则（可折叠） -->
    <div class="card-blue module-fold">
      <div class="fold-header" @click="showModule4 = !showModule4">
        <span class="fold-title">四、套餐履约规则（可折叠）</span>
        <span class="fold-status" v-if="!showModule4">{{ module4Status }}</span>
        <span class="fold-arrow">{{ showModule4 ? '▼' : '›' }}</span>
      </div>
      <div v-if="showModule4" @click.stop>

        <!-- 退款规则 -->
        <span class="label"><span class="label-text">退款规则</span></span>
        <div class="rule-field" @click="refundOpen = !refundOpen">
          <span class="rule-text" :class="{ placeholder: !form.refundRule }">{{ form.refundRule || '点击选择退款规则' }}</span>
          <span class="rule-arrow" :class="{ open: refundOpen }">▼</span>
        </div>
        <div class="rule-options" v-if="refundOpen">
          <div class="rule-option" :class="{ active: refundPreset === 'full' }" @click.stop="selectRefund('full')">未开卡全额退，开卡按比例退</div>
          <div class="rule-option" :class="{ active: refundPreset === 'custom' }" @click.stop="selectRefund('custom')">其他</div>
          <div class="rule-custom" v-if="refundPreset === 'custom'" @click.stop>
            <input class="input-blue" v-model="refundCustomText" placeholder="请输入退款规则" @input="onRefundCustomInput" />
          </div>
        </div>

        <!-- 转卡规则 -->
        <span class="label"><span class="label-text">转卡规则</span></span>
        <div class="rule-field" @click="transferOpen = !transferOpen">
          <span class="rule-text" :class="{ placeholder: !form.transferRule }">{{ form.transferRule || '点击选择转卡规则' }}</span>
          <span class="rule-arrow" :class="{ open: transferOpen }">▼</span>
        </div>
        <div class="rule-options" v-if="transferOpen">
          <div class="rule-option" :class="{ active: transferPreset === 'no' }" @click.stop="selectTransfer('no')">不可转卡</div>
          <div class="rule-option" :class="{ active: transferPreset === 'free' }" @click.stop="selectTransfer('free')">可转卡，无手续费</div>
          <div class="rule-option" :class="{ active: transferPreset === 'fee' }" @click.stop="selectTransfer('fee')">可转卡，手续费 __%</div>
          <div class="rule-custom" v-if="transferPreset === 'fee'" @click.stop>
            <span class="inline-label">手续费</span>
            <input class="input-blue fee-input" v-model.number="transferFee" type="number" placeholder="%" min="0" max="100" @input="onTransferFeeInput" />
            <span class="inline-suffix">%</span>
          </div>
        </div>

        <!-- 暂停规则 -->
        <span class="label"><span class="label-text">暂停规则</span></span>
        <div class="rule-field" @click="pauseOpen = !pauseOpen">
          <span class="rule-text" :class="{ placeholder: !form.pauseRule }">{{ form.pauseRule || '点击选择暂停规则' }}</span>
          <span class="rule-arrow" :class="{ open: pauseOpen }">▼</span>
        </div>
        <div class="rule-options" v-if="pauseOpen">
          <div class="rule-option" :class="{ active: pausePreset === 'no' }" @click.stop="selectPause('no')">不可暂停</div>
          <div class="rule-option" :class="{ active: pausePreset === 'free' }" @click.stop="selectPause('free')">可暂停，无附加条件</div>
          <div class="rule-option" :class="{ active: pausePreset === 'custom' }" @click.stop="selectPause('custom')">可暂停 __ 次，每次最长 __ 天</div>
          <div class="rule-custom" v-if="pausePreset === 'custom'" @click.stop>
            <span class="inline-label">可暂停</span>
            <input class="input-blue pause-num" v-model.number="pauseCount" type="number" placeholder="次" min="0" @input="onPauseCustomInput" />
            <span class="inline-label">次，每次最长</span>
            <input class="input-blue pause-num" v-model.number="pauseDays" type="number" placeholder="天" min="0" @input="onPauseCustomInput" />
            <span class="inline-label">天</span>
          </div>
        </div>

      </div>
    </div>

    <!-- 模块五：促销附加说明（选填） -->
    <div class="card-blue module-fold">
      <div class="fold-header" @click="showModule5 = !showModule5">
        <span class="fold-title fold-optional">五、促销附加说明（选填）</span>
        <span class="fold-arrow">{{ showModule5 ? '▼' : '›' }}</span>
      </div>
      <div v-if="showModule5" @click.stop>
        <input class="input-blue" v-model="form.promoNote" placeholder="如：限时优惠、赠送权益说明等" />
      </div>
    </div>

    <!-- 上传合同/付款凭证等材料 -->
    <div class="card-blue upload-card">
      <div class="upload-card-header">
        <span class="upload-title">上传合同/付款凭证等材料（选填）</span>
        <span class="upload-count" v-if="images.length">已保存 {{ images.length }} 份</span>
      </div>
      <div class="btn-add-img" @click="showTypePicker = true">+ 上传</div>
      <div class="img-previews" v-if="images.length">
        <div class="img-item" v-for="(img, i) in images" :key="i">
          <img v-if="img.dataUrl" :src="img.dataUrl" class="img-thumb" />
          <div v-else class="img-thumb file-icon">📄</div>
          <div class="img-info">
            <span class="img-name">{{ img.name }}</span>
            <span class="img-size">{{ img.materialLabel || '' }} · {{ formatSize(img.size) }}</span>
          </div>
          <div class="img-saved">✓ 已保存</div>
          <div class="img-del" @click="images.splice(i, 1)">✕</div>
        </div>
      </div>
    </div>

    <!-- 材料类型选择弹窗 -->
    <div v-if="showTypePicker" class="mask" @click="showTypePicker = false">
      <div class="modal-pick" @click.stop>
        <span class="modal-title">选择材料类型</span>
        <div class="type-list">
          <div class="type-item" v-for="mt in materialTypes" :key="mt.key" @click="onTypePicked(mt)">
            <span class="type-name">{{ mt.label }}</span>
            <span class="type-arrow">›</span>
          </div>
        </div>
        <div class="btn-cancel" @click="showTypePicker = false">取消</div>
      </div>
    </div>

    <!-- 上传方式选择弹窗 -->
    <div v-if="showMethodPicker" class="mask" @click="showMethodPicker = false">
      <div class="modal-pick" @click.stop>
        <span class="modal-title">选择上传方式</span>
        <span class="modal-sub">材料类型: {{ pickedType?.label }}</span>
        <div class="divider" />
        <div class="option" @click="uploadCamera">拍 摄<span class="opt-arrow">›</span></div>
        <div class="option" @click="uploadAlbum">相册选择<span class="opt-arrow">›</span></div>
        <div class="option" @click="uploadFile">文件上传<span class="opt-arrow">›</span></div>
        <div class="btn-cancel" @click="showMethodPicker = false">取消</div>
      </div>
    </div>

    <!-- 底部双按钮 -->
    <div class="card-blue bottom-btns">
      <div class="btn-draft" @click="saveDraftBtn">保存草稿</div>
      <div class="btn-primary" @click="onSubmit">确认录入，生成预付资产卡片</div>
    </div>

    <span class="disclaimer">本工具仅作消费风险管理辅助，不构成法律咨询服务</span>

    <!-- 子组件 -->
    <scene-picker
      v-if="showScenePicker"
      @confirm="onSceneConfirm"
      @custom="onSceneCustom"
      @close="showScenePicker = false"
    />
    <scene-custom v-if="showCustomScene" @confirm="onCustomSceneConfirm" @close="showCustomScene = false" />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { getDraft, saveDraft, clearDraft } from '@/common/storage.js'
import { isPositiveNumber, isPositiveInt } from '@/common/validator.js'
import { track } from '@/common/analytics.js'
import ScenePicker from '@/components/scene-picker/index.vue'
import SceneCustom from '@/components/scene-picker/custom.vue'
const router = useRouter()
const route = useRoute()
const $toast = (msg) => window.__toast?.(msg)

const scene = ref('健身/舞蹈')
const showScenePicker = ref(false)
const showCustomScene = ref(false)

function toggleUnlimited() {
  form.value.unlimited = !form.value.unlimited
  if (form.value.unlimited) form.value.noExpiry = false  // 互斥
}
function toggleNoExpiry() {
  form.value.noExpiry = !form.value.noExpiry
  if (form.value.noExpiry) form.value.unlimited = false  // 互斥
}
const showTypePicker = ref(false)
const showMethodPicker = ref(false)
const pickedType = ref(null)

const materialTypes = [
  { key: 'contract',     label: '合同协议' },
  { key: 'payment',      label: '付款截图' },
  { key: 'poster',       label: '活动海报' },
  { key: 'chat',         label: '销售聊天记录' },
  { key: 'writeoff',     label: '核销打卡记录' },
  { key: 'notice',       label: '迁店/停业通知' },
  { key: 'refund_chat',  label: '退费沟通记录' },
  { key: 'negotiation',  label: '退款转卡协商材料' },
]
const showModule2 = ref(false)  // 默认折叠
const showModule3 = ref(false)
const showModule4 = ref(false)
const showModule5 = ref(false)

// 折叠状态下的完成标识
const module2Status = computed(() => {
  const parts = []
  if (form.value.monthlyBudget && isPositiveNumber(form.value.monthlyBudget)) parts.push('预算已填')
  if (form.value.weeklyFreq && isPositiveNumber(form.value.weeklyFreq)) parts.push('频率已填')
  return parts.length === 2 ? '✓ 已完成' : parts.length ? '已填 ' + parts.length + '/2' : '待填写'
})
const module3Status = computed(() => {
  const parts = []
  if (form.value.storeName) parts.push(1)
  if (form.value.contractName) parts.push(1)
  if (form.value.payeeName) parts.push(1)
  return parts.length === 3 ? '✓ 已完成' : parts.length ? '已填 ' + parts.length + '/3' : '待填写'
})
const module4Status = computed(() => {
  const parts = []
  if (form.value.refundRule) parts.push(1)
  if (form.value.transferRule) parts.push(1)
  if (form.value.pauseRule) parts.push(1)
  return parts.length === 3 ? '✓ 已完成' : parts.length ? '已设 ' + parts.length + '/3' : '选填'
})

// ── 模块四：规则选择器状态 ──
// 退款规则
const refundOpen = ref(false)
const refundPreset = ref('')        // 'full' | 'custom' | ''
const refundCustomText = ref('')
function selectRefund(preset) {
  refundPreset.value = preset
  if (preset === 'full') {
    form.value.refundRule = '未开卡全额退，开卡按比例退'
    refundOpen.value = false
  } else if (preset === 'custom') {
    form.value.refundRule = refundCustomText.value
    // 不关闭，让用户输入
  }
}
function onRefundCustomInput() {
  form.value.refundRule = refundCustomText.value
}

// 转卡规则
const transferOpen = ref(false)
const transferPreset = ref('')      // 'no' | 'free' | 'fee' | ''
const transferFee = ref(null)
function selectTransfer(preset) {
  transferPreset.value = preset
  if (preset === 'no') {
    form.value.transferRule = '不可转卡'
    transferOpen.value = false
  } else if (preset === 'free') {
    form.value.transferRule = '可转卡，无手续费'
    transferOpen.value = false
  } else if (preset === 'fee') {
    transferFee.value = null
    form.value.transferRule = ''
  }
}
function onTransferFeeInput() {
  const fee = transferFee.value
  form.value.transferRule = (fee || fee === 0) ? `可转卡，手续费${fee}%` : ''
}

// 暂停规则
const pauseOpen = ref(false)
const pausePreset = ref('')         // 'no' | 'free' | 'custom' | ''
const pauseCount = ref(null)
const pauseDays = ref(null)
function selectPause(preset) {
  pausePreset.value = preset
  if (preset === 'no') {
    form.value.pauseRule = '不可暂停'
    pauseOpen.value = false
  } else if (preset === 'free') {
    form.value.pauseRule = '可暂停，无附加条件'
    pauseOpen.value = false
  } else if (preset === 'custom') {
    pauseCount.value = null
    pauseDays.value = null
    form.value.pauseRule = ''
  }
}
function onPauseCustomInput() {
  const c = pauseCount.value
  const d = pauseDays.value
  form.value.pauseRule = (c && d) ? `可暂停${c}次，每次最长${d}天` : (c ? `可暂停${c}次` : '')
}

// 外部点击关闭规则选项
function closeAllRulePickers() {
  refundOpen.value = false
  transferOpen.value = false
  pauseOpen.value = false
}

// 从 form 值反向同步规则选择器 UI 状态（草稿恢复/决策卡返回时调用）
function syncRulePickers() {
  // 退款规则
  if (form.value.refundRule === '未开卡全额退，开卡按比例退') {
    refundPreset.value = 'full'
  } else if (form.value.refundRule) {
    refundPreset.value = 'custom'
    refundCustomText.value = form.value.refundRule
  }
  // 转卡规则
  if (form.value.transferRule === '不可转卡') {
    transferPreset.value = 'no'
  } else if (form.value.transferRule === '可转卡，无手续费') {
    transferPreset.value = 'free'
  } else if (form.value.transferRule && form.value.transferRule.startsWith('可转卡，手续费')) {
    transferPreset.value = 'fee'
    const m = form.value.transferRule.match(/手续费(\d+)%/)
    if (m) transferFee.value = parseInt(m[1])
  }
  // 暂停规则
  if (form.value.pauseRule === '不可暂停') {
    pausePreset.value = 'no'
  } else if (form.value.pauseRule === '可暂停，无附加条件') {
    pausePreset.value = 'free'
  } else if (form.value.pauseRule && form.value.pauseRule.startsWith('可暂停')) {
    pausePreset.value = 'custom'
    const mc = form.value.pauseRule.match(/可暂停(\d+)次/)
    const md = form.value.pauseRule.match(/最长(\d+)天/)
    if (mc) pauseCount.value = parseInt(mc[1])
    if (md) pauseDays.value = parseInt(md[1])
  }
}

const images = ref([])

const form = ref({
  totalPrice: '', totalTimes: '', giftTimes: '0',
  validityValue: '', validityUnit: 'month', noExpiry: false, unlimited: false,
  monthlyBudget: '', weeklyFreq: '',
  storeName: '', contractName: '', payeeName: '',
  refundRule: '', transferRule: '', pauseRule: '',
  promoNote: ''
})

const unitLabel = computed(() =>
  form.value.validityUnit === 'day' ? '日' : form.value.validityUnit === 'quarter' ? '季度' : '个月'
)

// 将数字+单位统一折算为"月"数，供后续规则引擎使用
const validityMonths = computed(() => {
  if (form.value.noExpiry) return 99  // 次卡无固定期限，设一个较大值
  const v = parseInt(form.value.validityValue) || 0
  if (form.value.validityUnit === 'day')   return +(v / 30).toFixed(1)
  if (form.value.validityUnit === 'quarter') return v * 3
  return v
})

const totalPrice = computed(() => parseFloat(form.value.totalPrice) || 0)
const totalTimes = computed(() => {
  if (form.value.unlimited) return 999  // 无限次模式
  return parseInt(form.value.totalTimes) || 0
})
const baseUnitCost = computed(() => {
  if (!totalPrice.value) return 0
  if (form.value.unlimited) {
    const months = validityMonths.value || 12
    const daily = (totalPrice.value / (months * 30)).toFixed(1)
    const monthly = (totalPrice.value / months).toFixed(0)
    return `${daily}元/天 · 约${monthly}元/月`
  }
  if (!totalTimes.value) return 0
  const giftTimes = parseInt(form.value.giftTimes) || 0
  const total = totalTimes.value + giftTimes
  return (totalPrice.value / total).toFixed(1) + '元/次'
})
const freqEstimate = computed(() => {
  if (form.value.unlimited) {
    const freq = parseFloat(form.value.weeklyFreq) || 0
    const months = validityMonths.value || 12
    if (!freq || freq <= 0) return { show: false }
    const totalVisits = Math.round(freq * 4.33 * months)
    return {
      show: true,
      risk: false,
      msg: `✓ 充卡模式 · 按每周 ${freq} 次估算，有效期 ${months} 个月内预计到店约 ${totalVisits} 次`
    }
  }
  const total = parseInt(form.value.totalTimes) || 0
  const freq = parseFloat(form.value.weeklyFreq) || 0
  const months = validityMonths.value || 12
  if (!total || !freq) return { show: false }

  const estimatedMonths = Math.round(total / (freq * 4.33))
  const neededPerWeek = (total / (months * 4.33)).toFixed(1)

  if (freq >= parseFloat(neededPerWeek)) {
    return {
      show: true,
      risk: false,
      msg: `✓ 按每周 ${freq} 次的频率，预计 ${estimatedMonths} 个月用完，在有效期 ${months} 个月内可以完成`
    }
  } else {
    const remaining = Math.round(total - freq * 4.33 * months)
    return {
      show: true,
      risk: true,
      msg: `⚠ 按每周 ${freq} 次的频率，预计 ${estimatedMonths} 个月才能用完，但有效期只有 ${months} 个月，到期时约有 ${remaining} 次用不完。建议提升频率到每周 ≥${neededPerWeek} 次，或选择更短期的套餐`
    }
  }
})
const progress = computed(() => {
  let p = 0
  if (totalPrice.value && (form.value.unlimited || totalTimes.value) && (form.value.validityValue || form.value.noExpiry)) p++
  if (form.value.monthlyBudget && form.value.weeklyFreq) p++
  if (form.value.storeName && form.value.contractName && form.value.payeeName) p++
  if (form.value.refundRule || form.value.transferRule || form.value.pauseRule) p++
  if (form.value.promoNote) p++
  return p
})

onMounted(() => {
  // 读取场景参数（从首页场景标签或自定义场景传入）
  if (route.query.scene) {
    scene.value = route.query.scene
  }

  // 优先：从决策卡返回时恢复数据
  const draftBack = sessionStorage.getItem('qf_draft_back')
  if (draftBack) {
    try {
      const d = JSON.parse(draftBack)
      Object.assign(form.value, {
        totalPrice: d.totalPrice || '', totalTimes: d.totalTimes || '',
        giftTimes: d.giftTimes || '0', validityValue: d.validityValue || '',
        validityUnit: d.validityUnit || 'month', noExpiry: d.noExpiry || false, unlimited: d.unlimited || false, monthlyBudget: d.monthlyBudget || '',
        weeklyFreq: d.weeklyFreq || '', storeName: d.storeName || '',
        contractName: d.contractName || '', payeeName: d.payeeName || '',
        refundRule: d.refundRule || '', transferRule: d.transferRule || '',
        pauseRule: d.pauseRule || '', promoNote: d.promoNote || ''
      })
      scene.value = d.scene || '健身/舞蹈'
      syncRulePickers()
      sessionStorage.removeItem('qf_draft_back')
    } catch (e) { /* ignore */ }
    return
  }

  // 草稿恢复
  const draft = getDraft()
  if (draft) {
    if (window.confirm('检测到未完成草稿\n是否恢复上次编辑的内容？')) {
      Object.assign(form.value, draft.form || {})
      scene.value = draft.scene || '健身/舞蹈'
      images.value = draft.images || []
      syncRulePickers()
    } else {
      clearDraft()
    }
  }
})

function goBack() {
  const hasContent = Object.values(form.value).some(v => v)
  if (hasContent) {
    if (window.confirm('放弃编辑？\n当前内容尚未保存，确定返回吗？')) {
      saveDraft({ form: form.value, scene: scene.value, images: images.value })
      router.push('/home')
    }
  } else {
    router.push('/home')
  }
}

function onSceneConfirm(name) {
  scene.value = name
  showScenePicker.value = false
}
function onSceneCustom() {
  showScenePicker.value = false
  showCustomScene.value = true
}
function onCustomSceneConfirm(name) {
  scene.value = name
  showCustomScene.value = false
}

// 上传流程
function onTypePicked(mt) { pickedType.value = mt; showTypePicker.value = false; showMethodPicker.value = true }
function uploadCamera() { showMethodPicker.value = false; pickAndSave('image/*', 'camera') }
function uploadAlbum()  { showMethodPicker.value = false; pickAndSave('image/*', null) }
function uploadFile()   { showMethodPicker.value = false; pickAndSave('*/*', null) }

function pickAndSave(accept, capture) {
  const inp = document.createElement('input')
  inp.type = 'file'; inp.accept = accept
  if (capture) inp.setAttribute('capture', 'environment')
  inp.multiple = true

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    window.removeEventListener('focus', onFocusCancel)
    if (inp.parentNode) document.body.removeChild(inp)
  }

  inp.onchange = (e) => {
    const files = e.target.files
    if (!files || !files.length) { cleanup(); return }
    Array.from(files).forEach(f => {
      const entry = {
        name: f.name,
        size: f.size,
        materialLabel: pickedType.value?.label || '',
        dataUrl: null,
        mimeType: f.type || 'application/octet-stream'
      }
      // 图片和非图片文件都读取 base64，确保后续导出时都能预览/下载
      const reader = new FileReader()
      reader.onload = () => { entry.dataUrl = reader.result }
      reader.readAsDataURL(f)
      images.value.push(entry)
    })
    $toast(`已保存 ${files.length} 份材料`)
    cleanup()
  }
  // 用户取消选择时清理
  inp.addEventListener('cancel', cleanup)
  const onFocusCancel = () => {
    setTimeout(() => {
      if (!cleaned && inp.parentNode) document.body.removeChild(inp)
      window.removeEventListener('focus', onFocusCancel)
    }, 500)
  }
  window.addEventListener('focus', onFocusCancel)
  document.body.appendChild(inp)
  inp.click()
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1048576).toFixed(1) + 'MB'
}

function saveDraftBtn() {
  const hasContent = Object.values(form.value).some(v => v)
  if (!hasContent) {
    tip('暂无可保存的内容')
    return
  }
  saveDraft({ form: form.value, scene: scene.value, images: images.value })
  track('套餐录入', '保存草稿', scene.value)
  tip('草稿已保存')
}

function tip(msg) {
  // 兜底：Toast 不可用时用 alert
  if (window.__toast) { window.__toast(msg) } else { alert(msg) }
}

function onSubmit() {
  const errors = []
  if (!totalPrice.value || !isPositiveNumber(form.value.totalPrice)) {
    errors.push('套餐总价')
  }
  if (!form.value.unlimited && (!totalTimes.value || !isPositiveInt(form.value.totalTimes))) {
    errors.push('总服务次数')
  }
  if (!form.value.noExpiry && (!form.value.validityValue || !isPositiveInt(form.value.validityValue))) {
    errors.push('服务有效期限')
  }
  if (!form.value.monthlyBudget || !isPositiveNumber(form.value.monthlyBudget)) {
    errors.push('每月预付预算')
  }
  if (!form.value.weeklyFreq || !isPositiveNumber(form.value.weeklyFreq)) {
    errors.push('每周使用次数')
  }
  if (!form.value.storeName) { errors.push('门店名称') }
  if (!form.value.contractName) { errors.push('签约主体') }
  if (!form.value.payeeName) { errors.push('收款账户') }

  if (errors.length) {
    tip('请完善以下信息：' + errors.join('、'))
    return
  }

  clearDraft()
  // 将套餐数据存入 sessionStorage，决策卡页面读取
  const pkg = {
    ...form.value,
    scene: scene.value,
    validityMonths: validityMonths.value,
    // 携带已上传的材料图片
    images: images.value,
    // 从表单字段推断规则引擎需要的布尔标志
    hasContract: !!(form.value.contractName && form.value.contractName.trim()),
    refundClear: !!(form.value.refundRule && form.value.refundRule.trim()),
    transferClear: !!(form.value.transferRule && form.value.transferRule.trim()),
    moveClear: false,
    hasGift: !!(form.value.giftTimes && parseInt(form.value.giftTimes) > 0),
    giftClear: !!(form.value.giftTimes && parseInt(form.value.giftTimes) > 0),
    hasPayment: images.value.length > 0 || !!(form.value.contractName && form.value.contractName.trim()),
    hasPromo: !!(form.value.promoNote && form.value.promoNote.trim()),
    hasRecord: false,
    refundKnown: !!(form.value.refundRule && form.value.refundRule.trim())
  }
  try {
    sessionStorage.setItem('qf_package_data', JSON.stringify(pkg))
    track('套餐录入', '确认录入', scene.value, Math.round(totalPrice.value))
    router.push('/decision-card')
  } catch (e) {
    tip('保存失败，请检查浏览器存储空间')
    console.error('套餐录入提交失败:', e)
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 56px;
}
.nav-bar {
  display: flex; align-items: center; height: 44px; padding: 0 16px;
  border-bottom: 0.5px solid #48A9A6;
}
.back { font-size: 15px; color: #48A9A6; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; }

.scene-switch {
  display: flex; justify-content: space-between; align-items: center;
  margin: 8px 16px; padding: 10px 14px;
  background: #fff; border: 1px solid #48A9A6; border-radius: 6px;
  font-size: 13px; color: #245957;
}
.switch-link { font-size: 12px; color: #48A9A6; }

.progress { display: flex; align-items: center; margin: 0 16px 8px; }
.progress-bar { flex: 1; height: 4px; background: #E6E6E6; border-radius: 2px; overflow: hidden; display: flex; }
.progress-bar > div:first-child { background: #48A9A6; border-radius: 2px; width: 20%; height: 4px; margin-right: 2px; }
.progress-fill { background: #48A9A6; height: 4px; border-radius: 2px; transition: width .3s; }
.progress-text { font-size: 11px; color: #638F8D; margin-left: 8px; white-space: nowrap; }

.module { padding: 14px; margin: 14px 16px 0; }
.module-header { display: flex; align-items: center; margin-bottom: 12px; }
.module-bar { width: 3px; height: 16px; background: #48A9A6; border-radius: 1.5px; margin-right: 8px; }
.module-title { font-size: 15px; font-weight: bold; color: #245957; }

.label { display: block; font-size: 14px; color: #245957; margin: 8px 0 4px; }
.star { color: #E8686A; }
.label-hint { font-size: 11px; color: #638F8D; font-weight: normal; margin-left: 4px; }
.label-text { color: #245957; }
.input-blue { margin-bottom: 4px; }

.validity-row { display: flex; gap: 8px; }
.validity-input { flex: 1; }
.unit-tabs { display: flex; gap: 4px; }
.unit-tab { height: 44px; padding: 0 14px; border: 1px solid #48A9A6; border-radius: 8px; font-size: 14px; color: #48A9A6; display: flex; align-items: center; cursor: pointer; white-space: nowrap; }
.unit-tab.active { background: #48A9A6; color: #fff; font-weight: bold; }
.validity-display { display: block; margin-top: 6px; font-size: 12px; color: #48A9A6; }

.no-expiry-toggle {
  display: inline-flex; align-items: center; gap: 10px; margin-top: 4px;
  padding: 8px 14px; border: 1.5px solid #B8E6E1; border-radius: 8px;
  cursor: pointer; user-select: none; transition: border-color .2s;
}
.no-expiry-toggle.active { border-color: #48A9A6; }
.toggle-dot {
  width: 36px; height: 20px; border-radius: 10px; background: #D8D8D8;
  position: relative; transition: background .2s;
}
.toggle-dot::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%; background: #fff;
  transition: transform .2s;
}
.no-expiry-toggle.active .toggle-dot { background: #48A9A6; }
.no-expiry-toggle.active .toggle-dot::after { transform: translateX(16px); }
.toggle-label { font-size: 13px; color: #638F8D; }
.no-expiry-toggle.active .toggle-label { color: #245957; font-weight: bold; }

.cost-preview {
  padding: 8px 14px; margin-top: 8px;
  background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 6px;
  font-size: 12px; color: #48A9A6;
}

.freq-info { padding: 10px 14px; margin-top: 8px; border-radius: 6px; font-size: 12px; line-height: 1.6; }
.freq-ok { background: #B8E6E1; border: 1px solid #48A9A6; color: #48A9A6; }
.freq-warn { background: #FFF3CD; border: 1px solid #DC3545; color: #DC3545; }

.module-fold { margin: 8px 16px 0; padding: 14px; }
.fold-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }
.fold-title { font-size: 13px; color: #245957; }
.fold-optional { color: #638F8D; }
.fold-status { font-size: 11px; color: #48A9A6; margin-left: auto; margin-right: 8px; }
.fold-arrow { font-size: 12px; color: #638F8D; }

.upload-card { margin: 8px 16px 0; padding: 14px; }
.upload-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.upload-title { font-size: 13px; font-weight: bold; color: #245957; }
.upload-count { font-size: 11px; color: #48A9A6; font-weight: bold; }
.btn-add-img {
  display: inline-flex; align-items: center; justify-content: center;
  height: 28px; padding: 0 14px; margin-top: 4px;
  background: #fff; border: 1px solid #48A9A6; border-radius: 6px;
  font-size: 11px; color: #48A9A6; cursor: pointer;
}
.img-previews { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.img-item { position: relative; width: 80px; }
.img-thumb { width: 80px; height: 80px; border-radius: 6px; object-fit: cover; display: block; }
.img-info { padding: 3px 0; }
.img-name { display: block; font-size: 9px; color: #245957; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.img-size { display: block; font-size: 9px; color: #638F8D; }
.img-saved { position: absolute; top: 4px; left: 4px; padding: 2px 6px; background: #28A745; color: #fff; font-size: 8px; font-weight: bold; border-radius: 4px; }
.img-del { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: #E8686A; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; }

.bottom-btns { margin: 14px 16px; padding: 14px; }
.btn-draft {
  height: 44px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #245957; border-radius: 8px;
  font-size: 13px; font-weight: bold; color: #245957; margin-bottom: 8px;
}

.disclaimer { text-align: center; font-size: 10px; color: #638F8D; padding: 8px 16px 16px; }

/* 上传弹窗 */
.mask { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.modal-pick { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 20px 24px 24px; box-shadow: 0 4px 16px rgba(0,0,0,.15); max-height: 80vh; overflow-y: auto; }
.modal-title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; margin-bottom: 4px; }
.modal-sub { display: block; text-align: center; font-size: 12px; color: #48A9A6; margin-top: 4px; }
.divider { height: 1px; background: #B8E6E1; margin: 14px 0; }
.type-list { max-height: 360px; overflow-y: auto; }
.type-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #F0F0F0; cursor: pointer; }
.type-item:active { background: #F5F8FF; }
.type-name { font-size: 14px; color: #245957; }
.type-arrow { font-size: 16px; color: #638F8D; }
.option { display: flex; align-items: center; height: 48px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 8px; padding: 0 16px; margin: 6px 0; cursor: pointer; font-size: 15px; color: #245957; }
.option:active { opacity: 0.8; }
.opt-arrow { font-size: 18px; color: #48A9A6; margin-left: auto; }
.btn-cancel { margin-top: 8px; height: 44px; background: #fff; border: 1px solid #999; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #245957; cursor: pointer; }
.file-icon { display: flex; align-items: center; justify-content: center; background: #B8E6E1; font-size: 32px; }

/* ── 规则选择器 ── */
.rule-field {
  display: flex; align-items: center; justify-content: space-between;
  height: 44px; padding: 0 14px; margin-bottom: 6px;
  background: #fff; border: 1px solid #48A9A6; border-radius: 8px;
  cursor: pointer; user-select: none; transition: border-color .2s;
}
.rule-field:active { background: #F5FAFA; }
.rule-text { font-size: 14px; color: #245957; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rule-text.placeholder { color: #AAA; }
.rule-arrow { font-size: 11px; color: #638F8D; margin-left: 8px; transition: transform .2s; }
.rule-arrow.open { transform: rotate(180deg); }

.rule-options {
  margin: -2px 0 8px; padding: 6px;
  background: #F5FAFA; border: 1px solid #48A9A6; border-radius: 8px;
  animation: fadeIn .15s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

.rule-option {
  padding: 10px 12px; margin: 2px 0;
  border-radius: 6px; font-size: 13px; color: #245957;
  cursor: pointer; transition: background .15s;
}
.rule-option:active { background: #B8E6E1; }
.rule-option.active { background: #48A9A6; color: #fff; font-weight: bold; }

.rule-custom {
  display: flex; align-items: center; gap: 6px;
  margin-top: 4px; padding: 8px 12px;
  background: #fff; border: 1px dashed #48A9A6; border-radius: 6px;
}
.inline-label { font-size: 12px; color: #4A7A77; white-space: nowrap; }
.inline-suffix { font-size: 14px; font-weight: bold; color: #245957; }
.fee-input, .pause-num { width: 64px; height: 34px; text-align: center; margin: 0; }
</style>
