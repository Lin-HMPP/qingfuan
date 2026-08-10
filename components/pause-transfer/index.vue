<!-- 暂停锁卡 / 编辑套餐时间弹窗 · 对应 PRD 持仓卡功能 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <span class="title">套餐管理</span>
      <div class="tabs">
        <div class="tab" :class="{ active: tab === 'pause' }" @click="tab = 'pause'">暂停锁卡</div>
        <div class="tab" :class="{ active: tab === 'edit' }" @click="tab = 'edit'">编辑套餐时间</div>
      </div>
      <div class="divider" />

      <!-- 暂停锁卡 -->
      <template v-if="tab === 'pause'">
        <span class="label">暂停起止日期</span>
        <div class="date-row">
          <div class="date-field">
            <input class="input-half" v-model="pause.start" type="date" />
            <span class="date-tag">起始</span>
          </div>
          <span class="date-sep">—</span>
          <div class="date-field">
            <input class="input-half" v-model="pause.end" type="date" />
            <span class="date-tag">结束</span>
          </div>
        </div>
        <span class="label">暂停原因 / 备注</span>
        <textarea class="textarea-blue" v-model="pause.reason" placeholder="请输入暂停原因（选填）"></textarea>
        <span class="hint">暂停期间该套餐将无法进行核销或打卡操作</span>
        <div class="btn-row">
          <div class="btn-cancel flex-1" @click="$emit('close')">取消</div>
          <div class="btn-primary flex-1" @click="onPause">确认暂停</div>
        </div>
      </template>

      <!-- 编辑套餐时间 -->
      <template v-else>
        <span class="label">生效起始日期</span>
        <input class="input-blue" v-model="edit.startDate" type="date" />
        <span class="label">有效期限</span>
        <div class="validity-row">
          <input class="input-blue validity-input" v-model="edit.validityValue" type="number" placeholder="输入数字" />
          <div class="unit-tabs">
            <div class="unit-tab" :class="{ active: edit.validityUnit === 'day' }" @click="edit.validityUnit = 'day'">日</div>
            <div class="unit-tab" :class="{ active: edit.validityUnit === 'month' }" @click="edit.validityUnit = 'month'">月</div>
            <div class="unit-tab" :class="{ active: edit.validityUnit === 'quarter' }" @click="edit.validityUnit = 'quarter'">季度</div>
          </div>
        </div>
        <span class="validity-hint" v-if="edit.validityValue">
          有效期：{{ edit.validityValue }}{{ unitLabel }}
        </span>
        <span class="label">备注（选填）</span>
        <textarea class="textarea-blue" v-model="edit.note" placeholder="修改原因（选填）"></textarea>
        <span class="hint">修改后若截止日期已过，套餐将自动变为「已失效」状态</span>
        <div class="btn-row">
          <div class="btn-cancel flex-1" @click="$emit('close')">取消</div>
          <div class="btn-primary flex-1" @click="onEdit">确认修改</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { addPause, updateAsset } from '@/common/storage.js'

const $toast = (msg) => window.__toast?.(msg)
const props = defineProps({ asset: Object })
const emit = defineEmits(['close', 'updated'])
const tab = ref('pause')
const submitting = ref(false)

const pause = reactive({ start: '', end: '', reason: '' })

// 编辑套餐时间：默认值从当前资产读取
const assetCreated = computed(() => {
  if (!props.asset?.createdAt) return new Date().toISOString().slice(0, 10)
  return new Date(props.asset.createdAt).toISOString().slice(0, 10)
})
const edit = reactive({
  startDate: '',
  validityValue: '',
  validityUnit: 'month',
  note: ''
})

// 初始化编辑表单
onMounted(() => {
  edit.startDate = assetCreated.value
  edit.validityValue = props.asset?.validityMonths || ''
  edit.validityUnit = 'month'
})

const unitLabel = computed(() =>
  edit.validityUnit === 'day' ? '日' : edit.validityUnit === 'quarter' ? '季度' : '个月'
)

// 将单位折算为月数
function toMonths(value, unit) {
  const v = parseInt(value) || 0
  if (unit === 'day') return +(v / 30).toFixed(1)
  if (unit === 'quarter') return v * 3
  return v
}

function onPause() {
  if (submitting.value) return
  if (!props.asset?.id) { $toast('关联资产不存在'); return }
  if (!pause.start) { $toast('请选择起始日期'); return }
  if (pause.end && pause.end < pause.start) { $toast('结束日期不能早于起始日期'); return }
  submitting.value = true
  // 写入暂停记录
  addPause({ assetId: props.asset.id, type: 'pause', start: pause.start, end: pause.end, reason: pause.reason })
  // 更新资产状态为暂停
  updateAsset(props.asset.id, { status: 'paused' })
  $toast('套餐已暂停锁卡，暂停期内无法核销')
  emit('updated')
  emit('close')
}

function onEdit() {
  if (submitting.value) return
  if (!props.asset?.id) { $toast('关联资产不存在'); return }
  if (!edit.validityValue || parseInt(edit.validityValue) <= 0) { $toast('请输入有效的期限'); return }
  if (!edit.startDate) { $toast('请选择生效起始日期'); return }
  submitting.value = true

  const months = toMonths(edit.validityValue, edit.validityUnit)
  const newCreatedAt = new Date(edit.startDate).toISOString()

  // 判断新截止日期是否已过
  const endDate = new Date(edit.startDate)
  endDate.setMonth(endDate.getMonth() + months)
  const isExpired = endDate < new Date()

  updateAsset(props.asset.id, {
    createdAt: newCreatedAt,
    validityMonths: months,
    status: isExpired ? 'expired' : (props.asset.status === 'expired' ? 'active' : props.asset.status)
  })
  // 记录一条审计日志
  addPause({ assetId: props.asset.id, type: 'edit_time', start: edit.startDate, end: endDate.toISOString().slice(0, 10), reason: edit.note })

  $toast(isExpired ? '套餐时间已更新，当前已失效' : '套餐时间已更新')
  emit('updated')
  emit('close')
}
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(36,89,87,.45); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 20px 24px 24px; box-shadow: 0 4px 16px rgba(0,0,0,.15); max-height: 80vh; overflow-y: auto; }
.title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; }
.tabs { display: flex; margin-top: 16px; }
.tab { flex: 1; text-align: center; height: 36px; line-height: 36px; border-radius: 18px; font-size: 14px; cursor: pointer; }
.tab.active { background: #48A9A6; color: #fff; font-weight: bold; }
.tab:not(.active) { border: 1px solid #48A9A6; color: #245957; }
.divider { height: 0.5px; background: #48A9A6; margin: 16px 0; }
.label { display: block; font-size: 15px; font-weight: bold; color: #245957; margin-bottom: 6px; margin-top: 12px; }
.date-row { display: flex; align-items: center; gap: 6px; }
.date-field { flex: 1; }
.date-sep { font-size: 14px; color: #638F8D; }
.input-half { width: 100%; height: 44px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 0 12px; font-size: 14px; outline: none; color: #245957; box-sizing: border-box; }
.date-tag { display: block; font-size: 10px; color: #888; margin-top: 4px; text-align: center; }
.textarea-blue { width: 100%; min-height: 60px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 12px; font-size: 15px; outline: none; resize: vertical; color: #245957; box-sizing: border-box; }
.hint { display: block; font-size: 11px; color: #888; margin-top: 8px; }
.btn-row { display: flex; gap: 12px; margin-top: 14px; }
.flex-1 { flex: 1; }
.btn-cancel { height: 44px; border: 1px solid #999; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #245957; background: #fff; cursor: pointer; }
.btn-primary { height: 44px; background: #48A9A6; color: #fff; border-radius: 8px; border: none; font-size: 15px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.input-blue { width: 100%; height: 44px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 0 12px; font-size: 15px; color: #245957; outline: none; box-sizing: border-box; }
.validity-row { display: flex; gap: 8px; }
.validity-input { flex: 1; }
.unit-tabs { display: flex; gap: 4px; }
.unit-tab { height: 44px; padding: 0 14px; border: 1px solid #48A9A6; border-radius: 8px; font-size: 14px; color: #48A9A6; display: flex; align-items: center; cursor: pointer; white-space: nowrap; }
.unit-tab.active { background: #48A9A6; color: #fff; font-weight: bold; }
.validity-hint { display: block; margin-top: 6px; font-size: 12px; color: #48A9A6; }
</style>
