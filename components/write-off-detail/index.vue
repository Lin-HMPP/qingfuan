<!-- 核销记录详情弹窗 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <span class="title">{{ editing ? '编辑核销记录' : '核销记录详情' }}</span>
      <div class="close-btn" @click="$emit('close')">✕</div>
      <div class="divider" />

      <!-- 查看模式 -->
      <template v-if="!editing">
        <span class="label">核销日期</span><span class="value">{{ record.date }}</span>
        <span class="label">本次消耗课时</span><span class="value bold">{{ record.hours }} 课时</span>
        <span class="label">备注说明</span>
        <div class="note-box"><span>{{ record.note || '正常上课，教练确认无误' }}</span></div>
      </template>

      <!-- 编辑模式 -->
      <template v-else>
        <span class="label"><span class="star">*</span> 核销日期</span>
        <input class="input-blue" v-model="form.date" type="date" />
        <span class="label"><span class="star">*</span> 消耗课时</span>
        <input class="input-blue" v-model="form.hours" type="number" placeholder="输入消耗次数" />
        <span class="label">备注说明</span>
        <input class="input-blue" v-model="form.note" placeholder="训练内容、教练姓名等" />
      </template>

      <div class="divider" />
      <div class="btn-row">
        <template v-if="!editing">
          <div class="btn-primary flex-1" @click="onEdit">编辑</div>
          <div class="btn-secondary flex-1" @click="onDelete">删除</div>
        </template>
        <template v-else>
          <div class="btn-primary flex-1" @click="onSave">保存修改</div>
          <div class="btn-secondary flex-1" @click="editing = false">取消</div>
        </template>
        <div class="btn-cancel flex-1" @click="$emit('close')">关闭</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { deleteWriteOff, updateWriteOff, updateAsset, getAssetById } from '@/common/storage.js'
import { isPositiveInt } from '@/common/validator.js'

const $toast = (msg) => window.__toast?.(msg)
const props = defineProps({ record: Object })
const emit = defineEmits(['close', 'deleted', 'updated'])

const editing = ref(false)
const form = reactive({ date: '', hours: '', note: '' })

function onEdit() {
  form.date = props.record.date || ''
  form.hours = props.record.hours || ''
  form.note = props.record.note || ''
  editing.value = true
}

function onSave() {
  const h = parseInt(form.hours)
  if (!h || !isPositiveInt(form.hours)) { $toast('请输入有效的消耗次数'); return }
  if (!form.date) { $toast('请选择日期'); return }

  const oldHours = props.record.hours || 0
  const asset = getAssetById(props.record.assetId)

  // 更新资产：先减去旧课时，再加上新课时
  if (asset) {
    updateAsset(asset.id, { usedTimes: Math.max(0, (asset.usedTimes || 0) - oldHours + h) })
  }

  // 更新核销记录
  updateWriteOff(props.record.id, {
    date: form.date,
    hours: h,
    note: form.note,
    remainingAfter: (asset ? (asset.totalTimes || 0) - Math.max(0, (asset.usedTimes || 0) - oldHours + h) : 0)
  })

  $toast('核销记录已更新')
  editing.value = false
  emit('updated')
}

function onDelete() {
  if (window.confirm('确认删除\n删除后将返还对应课时，确定删除？')) {
    const asset = getAssetById(props.record.assetId)
    if (asset) updateAsset(asset.id, { usedTimes: Math.max(0, (asset.usedTimes || 0) - (props.record.hours || 0)) })
    deleteWriteOff(props.record.id)
    $toast('记录已删除，课时已返还')
    emit('deleted')
  }
}
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(36,89,87,.45); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 20px 24px 24px; position: relative; }
.title { display: block; text-align: center; font-size: 18px; font-weight: bold; }
.close-btn { position: absolute; top: 20px; right: 24px; font-size: 16px; color: #888; }
.divider { height: 0.5px; background: #48A9A6; margin: 12px 0; }
.label { display: block; font-size: 12px; color: #888; margin-top: 8px; }
.value { display: block; font-size: 15px; color: #245957; }
.value.bold { font-weight: bold; }
.note-box { padding: 10px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; font-size: 14px; color: #245957; margin-top: 4px; }
.btn-row { display: flex; gap: 8px; }
.flex-1 { flex: 1; }
.btn-cancel { height: 44px; border: 1px solid #999; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #245957; }
</style>
