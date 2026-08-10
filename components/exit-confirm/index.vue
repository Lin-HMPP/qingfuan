<!-- 退出确认弹窗 · 对应线框图 🚪 确认退出弹窗 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <span class="title">确认退出当前账号？</span>
      <span class="hint">退出后需重新登录才能使用预付管理功能</span>
      <div class="divider" />
      <div class="btn-row">
        <div class="btn-secondary flex-1" @click="$emit('close')">取消</div>
        <div class="btn-danger flex-1" @click="$emit('confirm')">确认退出</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['confirm', 'close'])
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(36,89,87,.45); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 32px 24px 24px; box-shadow: 0 4px 20px rgba(0,0,0,.12); }
.title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; }
.hint { display: block; text-align: center; font-size: 12px; color: #638F8D; margin-top: 8px; }
.divider { height: 0.5px; background: #48A9A6; margin: 16px 0; }
.btn-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; }
.btn-danger { height: 44px; background: #E8686A; color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; cursor: pointer; }
</style>
