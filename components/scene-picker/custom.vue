<!-- 自定义消费场景输入弹窗 · 对应线框图 ✏️ 自定义消费场景弹窗-美化版 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="header">
        <span class="title">自定义消费场景</span>
        <div class="close-btn" @click="$emit('close')">
          <span class="close-x">✕</span>
        </div>
      </div>
      <input
        class="input-blue"
        v-model="name"
        placeholder="输入自定义消费场景名称"
        :focus="true"
        maxlength="20"
      />
      <div class="btn-row">
        <div class="btn-secondary flex-1" @click="$emit('close')">取消</div>
        <div class="btn-primary flex-1" @click="onConfirm">确认</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { isValidSceneName } from '@/common/validator.js'

const $toast = (msg) => window.__toast?.(msg)
const emit = defineEmits(['confirm', 'close'])
const name = ref('')

function onConfirm() {
  if (!isValidSceneName(name.value)) {
    $toast?.('请输入场景名称')
    return
  }
  emit('confirm', name.value.trim())
}
</script>

<style lang="scss" scoped>
.mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  width: 343px;
  background: #fff;
  border: 1px solid #48A9A6;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,.12);
}
.header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.title { font-size: 18px; font-weight: bold; color: #245957; }
.close-btn { width: 28px; height: 28px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.close-x { font-size: 16px; color: #888; }
.input-blue { margin-bottom: 16px; }
.btn-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; }
</style>
