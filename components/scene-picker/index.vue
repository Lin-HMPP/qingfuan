<!-- 消费场景选择弹窗 · 对应线框图 🏷️ 消费场景选择弹窗-美化版 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="header">
        <span class="title">选择消费场景</span>
        <div class="close-btn" @click="$emit('close')">✕</div>
      </div>
      <span class="subtitle">请选择预付消费场景类型</span>
      <div class="divider" />
      <div class="option" v-for="s in scenes" :key="s" @click="$emit('confirm', s)">
        <div class="option-bar" />
        <span class="option-text">{{ s }}</span>
        <span class="option-arrow">›</span>
      </div>
      <div class="divider" />
      <div class="option custom" @click="$emit('custom')">
        <div class="option-bar gray" />
        <span class="option-text blue">+ 自定义</span>
        <span class="option-arrow blue">›</span>
      </div>
      <div class="btn-cancel" @click="$emit('close')">取消</div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['confirm', 'close', 'custom'])
const scenes = ['健身/舞蹈', '培训课程', '摄影套餐', '美容美发']
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 20px 0 24px; box-shadow: 0 4px 16px rgba(0,0,0,.15); }
.header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
.title { font-size: 18px; font-weight: bold; color: #245957; }
.close-btn { font-size: 16px; color: #888; padding: 4px; }
.subtitle { display: block; text-align: center; font-size: 12px; color: #888; margin-top: 4px; padding: 0 24px; }
.divider { height: 0.5px; background: #B8E6E1; margin: 12px 24px; }
.option { display: flex; align-items: center; height: 48px; padding: 0 24px; }
.option-bar { width: 4px; height: 20px; background: #48A9A6; border-radius: 2px; margin-right: 12px; }
.option-bar.gray { background: #CCCCCC; }
.option-text { flex: 1; font-size: 15px; color: #333; }
.option-text.blue { color: #48A9A6; font-weight: bold; }
.option-arrow { font-size: 18px; color: #888; }
.option-arrow.blue { color: #48A9A6; font-weight: bold; }
.btn-cancel { margin: 8px 24px 0; height: 44px; background: #B8E6E1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: #245957; }
</style>
