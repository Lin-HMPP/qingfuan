<!-- 凭证打包加载弹窗 -->
<template>
  <div class="mask">
    <div class="modal">
      <div class="spinner">
        <div class="spinner-ring" />
        <div class="hourglass">
          <div class="hg-top" /><div class="hg-mid" /><div class="hg-bot" />
        </div>
      </div>
      <span class="title">正在打包全套维权凭证</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
      </div>
      <span class="hint">文件将保存在本机文件夹</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const emit = defineEmits(['done'])
const progress = ref(0)

onMounted(() => {
  const timer = setInterval(() => {
    progress.value += 15
    if (progress.value >= 100) {
      clearInterval(timer)
      setTimeout(() => {
        window.__toast({ title: '文件已保存至本机文件夹', icon: 'none' })
        emit('done')
      }, 400)
    }
  }, 400)
})
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; height: 200px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,.12); }
.spinner { position: relative; width: 44px; height: 44px; margin-bottom: 16px; }
.spinner-ring { width: 48px; height: 48px; border: 2px solid #48A9A6; border-radius: 50%; position: absolute; top: -2px; left: -2px; }
.hourglass { width: 20px; height: 20px; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); }
.hg-top { width: 12px; height: 2px; background: #48A9A6; border-radius: 1px; margin: 0 auto; }
.hg-mid { width: 2px; height: 12px; margin: 0 auto; background: #48A9A6; }
.hg-bot { width: 12px; height: 2px; background: #48A9A6; border-radius: 1px; margin: 0 auto; }
.title { font-size: 15px; font-weight: bold; color: #245957; }
.progress-bar { width: 100%; height: 6px; background: #B8E6E1; border-radius: 3px; margin: 14px 0; overflow: hidden; }
.progress-fill { height: 100%; background: #48A9A6; border-radius: 3px; transition: width .3s; }
.hint { font-size: 12px; color: #638F8D; }
</style>
