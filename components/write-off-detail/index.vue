<!-- 核销记录详情弹窗 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop v-if="record">
      <span class="title">{{ editing ? (isUnlimited ? '编辑打卡记录' : '编辑核销记录') : (isUnlimited ? '打卡记录详情' : '核销记录详情') }}</span>
      <div class="close-btn" @click="$emit('close')">✕</div>
      <div class="divider" />

      <!-- 查看模式 -->
      <template v-if="!editing">
        <span class="label">{{ isUnlimited ? '打卡日期' : '核销日期' }}</span><span class="value">{{ record.date }}</span>
        <span class="label" v-if="!isUnlimited">本次消耗课时</span>
        <span class="label" v-else>打卡记录</span>
        <span class="value bold">{{ isUnlimited ? '到店 1 次' : record.hours + ' 课时' }}</span>
        <span class="label">备注说明</span>
        <div class="note-box"><span>{{ record.note || (isUnlimited ? '到店打卡' : '正常上课，教练确认无误') }}</span></div>
      </template>

      <!-- 编辑模式 -->
      <template v-else>
        <span class="label"><span class="star">*</span> {{ isUnlimited ? '打卡日期' : '核销日期' }}</span>
        <input class="input-blue" v-model="form.date" type="date" />
        <template v-if="!isUnlimited">
          <span class="label"><span class="star">*</span> 消耗课时</span>
          <input class="input-blue" v-model="form.hours" type="number" placeholder="输入消耗次数" />
        </template>
        <template v-else>
          <div class="checkin-badge">📍 到店打卡 · 自动计 1 次</div>
        </template>
        <span class="label">备注说明</span>
        <input class="input-blue" v-model="form.note" :placeholder="isUnlimited ? '训练内容等' : '训练内容、教练姓名等'" />
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
const props = defineProps({ record: Object, isUnlimited: { type: Boolean, default: false } })
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
  if (!form.date) { $toast('请选择日期'); return }

  // 无限次模式：始终为1次打卡
  if (props.isUnlimited) {
    const asset = getAssetById(props.record?.assetId)
    if (!asset) { $toast('关联资产不存在'); return }
    const oldHours = props.record?.hours || 0
    const newUsed = Math.max(0, (asset.usedTimes || 0) - oldHours + 1)
    updateAsset(asset.id, { usedTimes: newUsed })
    updateWriteOff(props.record.id, { date: form.date, hours: 1, note: form.note, remainingAfter: newUsed })
    $toast('打卡记录已更新')
    editing.value = false
    emit('updated')
    return
  }

  // 普通模式
  const h = parseInt(form.hours)
  if (!h || !isPositiveInt(form.hours)) { $toast('请输入有效的消耗次数'); return }

  const oldHours = props.record?.hours || 0
  const asset = getAssetById(props.record?.assetId)

  if (!asset) { $toast('关联资产不存在'); return }

  const newUsed = (asset.usedTimes || 0) - oldHours + h
  if (newUsed > (asset.totalTimes || 0)) {
    $toast(`消耗次数超出总次数（${asset.totalTimes}次），剩余可用 ${(asset.totalTimes || 0) - (asset.usedTimes || 0) + oldHours} 次`)
    return
  }

  updateAsset(asset.id, { usedTimes: Math.max(0, newUsed) })
  updateWriteOff(props.record.id, {
    date: form.date, hours: h, note: form.note,
    remainingAfter: Math.max(0, (asset.totalTimes || 0) - Math.max(0, newUsed))
  })

  $toast('核销记录已更新')
  editing.value = false
  emit('updated')
}

function onDelete() {
  const msg = props.isUnlimited
    ? '确认删除\n删除后将撤销本次打卡记录，确定删除？'
    : '确认删除\n删除后将返还对应课时，确定删除？'
  const successMsg = props.isUnlimited ? '打卡记录已删除' : '记录已删除，课时已返还'

  if (window.confirm(msg)) {
    const asset = getAssetById(props.record.assetId)
    if (asset) updateAsset(asset.id, { usedTimes: Math.max(0, (asset.usedTimes || 0) - (props.record.hours || 0)) })
    deleteWriteOff(props.record.id)
    $toast(successMsg)
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
.checkin-badge {
  padding: 10px 14px; margin: 4px 0;
  background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 8px;
  font-size: 13px; color: #245957; font-weight: bold; text-align: center;
}
</style>
