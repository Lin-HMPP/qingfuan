<!-- 图片选择弹窗 · 对应线框图 📷 图片选择弹窗 -->
<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="header">
        <span class="title">选择上传图片</span>
        <span class="subtitle">请选择获取凭证照片的方式</span>
        <div class="close-btn" @click="$emit('close')">
          <span class="close-x">✕</span>
        </div>
      </div>
      <div class="option" @click="onCamera">
        <div class="icon-camera">
          <div class="cam-top" />
          <div class="cam-body"><div class="cam-lens" /></div>
        </div>
        <span class="opt-text">拍  摄</span>
        <span class="opt-arrow">›</span>
      </div>
      <div class="divider-blue" />
      <div class="option" @click="onAlbum">
        <div class="icon-img">
          <div class="img-frame">
            <div class="img-sun" />
            <div class="img-mountain" />
          </div>
        </div>
        <span class="opt-text">相册选择</span>
        <span class="opt-arrow">›</span>
      </div>
      <div class="btn-cancel" @click="$emit('close')">取消</div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['confirm', 'close'])

function createInput(attrs) {
  const inp = document.createElement('input')
  inp.type = 'file'
  inp.accept = 'image/*'
  Object.assign(inp, attrs)
  inp.style.position = 'fixed'
  inp.style.top = '-100px'
  inp.style.left = '-100px'
  inp.style.opacity = '0'
  inp.style.pointerEvents = 'none'
  document.body.appendChild(inp)
  inp.addEventListener('change', async () => {
    const files = inp.files
    if (files && files.length) {
      const results = []
      for (let i = 0; i < files.length; i++) {
        results.push(await fileToBase64(files[i]))
      }
      emit('confirm', results)
    }
    document.body.removeChild(inp)
  })
  // 用户取消选择时也清理
  inp.addEventListener('cancel', () => document.body.removeChild(inp))
  // 兼容：监听 focus 回到 window 时清理
  const onFocus = () => {
    setTimeout(() => {
      if (inp.parentNode) document.body.removeChild(inp)
      window.removeEventListener('focus', onFocus)
    }, 500)
  }
  window.addEventListener('focus', onFocus)
  inp.click()
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ dataUrl: reader.result, name: file.name, size: file.size })
    reader.readAsDataURL(file)
  })
}

function onCamera() {
  createInput({ capture: 'environment' })
}

function onAlbum() {
  createInput({ multiple: true })
}
</script>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(36,89,87,.45); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,.12); }
.header { position: relative; text-align: center; margin-bottom: 16px; }
.title { font-size: 18px; font-weight: bold; color: #245957; }
.subtitle { display: block; font-size: 12px; color: #638F8D; margin-top: 4px; }
.close-btn { position: absolute; top: 0; right: 0; width: 28px; height: 28px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.close-x { font-size: 16px; color: #638F8D; }
.option { display: flex; align-items: center; height: 52px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 8px; padding: 0 16px; margin-bottom: 4px; }
.opt-text { flex: 1; font-size: 15px; font-weight: bold; color: #245957; margin-left: 16px; }
.opt-arrow { font-size: 20px; color: #48A9A6; }
.icon-camera { display: flex; flex-direction: column; align-items: center; }
.cam-top { width: 9px; height: 3px; background: #48A9A6; border-radius: 1.5px; }
.cam-body { width: 22px; height: 14px; border: 1.8px solid #48A9A6; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
.cam-lens { width: 8px; height: 8px; border: 1.8px solid #48A9A6; border-radius: 50%; }
.icon-img { display: flex; }
.img-frame { width: 20px; height: 16px; border: 1.8px solid #48A9A6; border-radius: 3px; position: relative; overflow: hidden; }
.img-sun { width: 6px; height: 6px; background: #48A9A6; border-radius: 50%; position: absolute; top: 1px; right: 2px; }
.img-mountain { width: 0; height: 0; border-left: 5px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #48A9A6; position: absolute; bottom: 0; left: 4px; }
.btn-cancel { margin-top: 12px; height: 44px; background: #fff; border: 1px solid #48A9A6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #245957; }
.divider-blue { height: 0.5px; background: #48A9A6; margin: 0; }
</style>
