<!-- 确认生成资产弹窗 · 对应线框图 💳 确认生成资产弹窗-美化版 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <span class="title">确认生成预付资产卡</span>
      <div class="close-btn" @click="$emit('close')">✕</div>
      <div class="divider" />
      <div class="info-box">
        <div class="info-row"><span class="info-label">消费场景</span><span class="info-value">{{ data?.scene || '--' }}</span></div>
        <div class="info-row"><span class="info-label">套餐名称</span><span class="info-value">{{ data?.storeName || '--' }}年卡</span></div>
        <div class="info-row"><span class="info-label">总价金额</span><span class="info-value">¥{{ (Number(data?.totalPrice) || 0).toLocaleString() }}</span></div>
        <div class="info-row"><span class="info-label">预估有效期</span><span class="info-value">{{ data?.validityMonths || '--' }} 个月</span></div>
      </div>
      <span class="note">资产创建后将永久保存在本地资产列表</span>
      <div class="divider" />
      <div class="btn-row">
        <div class="btn-cancel flex-1" @click="$emit('close')">取消</div>
        <div class="btn-primary flex-1" @click="$emit('confirm')">确认生成</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: Object })
defineEmits(['confirm', 'close'])
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 20px 24px 24px; box-shadow: 0 4px 16px rgba(0,0,0,.15); position: relative; }
.title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; }
.close-btn { position: absolute; top: 20px; right: 24px; font-size: 16px; color: #888; }
.divider { height: 0.5px; background: #B8E6E1; margin: 12px 0; }
.info-box { background: #B8E6E1; border-radius: 8px; padding: 14px; }
.info-row { display: flex; justify-content: space-between; padding: 4px 0; }
.info-label { font-size: 12px; color: #888; }
.info-value { font-size: 12px; color: #245957; }
.note { display: block; text-align: center; font-size: 12px; color: #888; margin-top: 10px; }
.btn-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; }
.btn-cancel { height: 44px; background: #B8E6E1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #245957; }
</style>
