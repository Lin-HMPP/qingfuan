<!-- 暂停/转卡弹窗 · 对应线框图 ⏸️ 暂停锁卡/套餐转卡 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <span class="title">套餐暂停 / 转卡申请</span>
      <div class="tabs">
        <div class="tab" :class="{ active: tab === 'pause' }" @click="tab = 'pause'">暂停锁卡</div>
        <div class="tab" :class="{ active: tab === 'transfer' }" @click="tab = 'transfer'">套餐转卡</div>
      </div>
      <div class="divider" />
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
      </template>
      <template v-else>
        <span class="label">转入人手机号</span>
        <input class="input-blue" v-model="transfer.phone" placeholder="请输入转入人手机号" />
        <span class="label">转卡原因</span>
        <textarea class="textarea-blue" v-model="transfer.reason" placeholder="请输入转卡原因"></textarea>
      </template>
      <div class="divider" />
      <div class="btn-row">
        <div class="btn-cancel flex-1" @click="$emit('close')">取消</div>
        <div class="btn-primary flex-1" @click="onSubmit">提交申请</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { addPause } from '@/common/storage.js'
import { isValidPhone } from '@/common/validator.js'

const $toast = (msg) => window.__toast?.(msg)
const props = defineProps({ asset: Object })
const emit = defineEmits(['close'])
const tab = ref('pause')
const submitting = ref(false)
const pause = reactive({ start: '', end: '', reason: '' })
const transfer = reactive({ phone: '', reason: '' })

function onSubmit() {
  if (submitting.value) return
  if (!props.asset?.id) { $toast('关联资产不存在'); return }

  if (tab.value === 'pause') {
    if (!pause.start) { $toast('请选择起始日期'); return }
    if (pause.end && pause.end < pause.start) { $toast('结束日期不能早于起始日期'); return }
    submitting.value = true
    addPause({ assetId: props.asset.id, type: 'pause', start: pause.start, end: pause.end, reason: pause.reason })
  } else {
    if (!transfer.phone) { $toast('请输入转入人手机号'); return }
    if (!isValidPhone(transfer.phone)) { $toast('请输入正确的11位手机号'); return }
    submitting.value = true
    addPause({ assetId: props.asset.id, type: 'transfer', phone: transfer.phone, reason: transfer.reason })
  }
  $toast('申请已提交')
  emit('close')
}
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(36,89,87,.45); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 20px 24px 24px; box-shadow: 0 4px 16px rgba(0,0,0,.15); }
.title { display: block; text-align: center; font-size: 18px; font-weight: bold; }
.tabs { display: flex; margin-top: 16px; }
.tab { flex: 1; text-align: center; height: 36px; line-height: 36px; border-radius: 18px; font-size: 14px; cursor: pointer; }
.tab.active { background: #48A9A6; color: #fff; font-weight: bold; }
.tab:not(.active) { border: 1px solid #48A9A6; color: #245957; }
.divider { height: 0.5px; background: #48A9A6; margin: 16px 0; }
.label { display: block; font-size: 15px; font-weight: bold; margin-bottom: 6px; margin-top: 12px; }
.date-row { display: flex; align-items: center; gap: 6px; }
.date-field { flex: 1; }
.date-sep { font-size: 14px; color: #638F8D; }
.input-half { width: 100%; height: 44px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 0 12px; font-size: 14px; outline: none; color: #245957; }
.date-tag { display: block; font-size: 10px; color: #888; margin-top: 4px; text-align: center; }
.textarea-blue { width: 100%; min-height: 60px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 12px; font-size: 15px; outline: none; resize: vertical; color: #245957; }
.btn-row { display: flex; gap: 12px; margin-top: 8px; }
.flex-1 { flex: 1; }
.btn-cancel { height: 44px; border: 1px solid #999; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #245957; }
</style>
