<template>
  <div class="editor-mask">
    <div class="editor-bar">
      <span class="editor-cancel" @click="$emit('cancel')">取消</span>
      <span class="editor-title">{{ mode === 'mosaic' ? '打码 · 涂抹隐私信息' : '裁剪 · 拖动调整范围' }}</span>
      <span class="editor-done" @click="onDone">{{ mode === 'crop' && !cropped ? '' : '完成' }}</span>
    </div>

    <div class="editor-tools">
      <div :class="['tool-btn', { active: mode === 'mosaic' }]" @click="mode = 'mosaic'; cropped = false">打码</div>
      <div :class="['tool-btn', { active: mode === 'crop' }]" @click="mode = 'crop'">裁剪</div>
      <div class="tool-btn" v-if="mode === 'mosaic'" @click="brushSize = brushSize === 20 ? 36 : brushSize === 36 ? 56 : 20">
        画笔 {{ brushSize === 20 ? '小' : brushSize === 36 ? '中' : '大' }}
      </div>
      <div class="tool-btn" v-if="dirty" @click="resetMosaic">撤销</div>
    </div>

    <div class="editor-stage" ref="stageRef">
      <img ref="imgRef" :src="src" class="editor-img" :style="imgStyle" @load="onImgLoad" />
      <!-- 裁剪框 -->
      <div v-if="mode === 'crop'" class="crop-overlay" @touchstart.prevent="cropStart" @touchmove.prevent="cropMove" @touchend.prevent="cropEnd"
        @mousedown.prevent="cropStart" @mousemove.prevent="cropMove" @mouseup.prevent="cropEnd">
        <div class="crop-shade" :style="cropShadeStyle" />
        <div class="crop-box" :style="cropBoxStyle">
          <div class="crop-corner" v-for="c in ['nw','ne','sw','se']" :key="c" :class="c" />
        </div>
      </div>
      <!-- 打码遮罩层 -->
      <canvas v-if="mode === 'mosaic'" ref="mosaicCanvas" class="mosaic-canvas" @touchstart.prevent="mosaicStart" @touchmove.prevent="mosaicMove"
        @mousedown.prevent="mosaicStart" @mousemove.prevent="mosaicMove" @mouseup="drawing = false" @mouseleave="drawing = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

const props = defineProps({ src: String })
const emit = defineEmits(['done', 'cancel'])

const stageRef = ref(null)
const imgRef = ref(null)
const mosaicCanvas = ref(null)
const mode = ref('mosaic')
const brushSize = ref(20)
const dirty = ref(false)
const cropped = ref(false)

// 图片显示
const imgW = ref(0)
const imgH = ref(0)
const imgStyle = computed(() => {
  if (!imgW.value) return { opacity: 0 }
  return { width: imgW.value + 'px', height: imgH.value + 'px', opacity: 1 }
})

function onImgLoad() {
  const stage = stageRef.value
  if (!stage) return
  const sw = stage.clientWidth
  const sh = stage.clientHeight
  const img = imgRef.value
  const ratio = img.naturalWidth / img.naturalHeight
  if (ratio > sw / sh) {
    imgW.value = sw; imgH.value = sw / ratio
  } else {
    imgH.value = sh; imgW.value = sh * ratio
  }
  nextTick(() => {
    if (mosaicCanvas.value) initMosaicCanvas()
  })
}

// ── 裁剪 ──
const cropX = ref(0); const cropY = ref(0)
const cropW = ref(150); const cropH = ref(150)
let cropDragCorner = null; let cropStartX = 0; let cropStartY = 0

const cropBoxStyle = computed(() => ({
  left: cropX.value + 'px', top: cropY.value + 'px',
  width: cropW.value + 'px', height: cropH.value + 'px'
}))
const cropShadeStyle = computed(() => {
  const t = cropY.value, l = cropX.value, r = l + cropW.value, b = t + cropH.value
  const W = imgW.value || 375, H = imgH.value || 400
  return {
    clipPath: `path('M0,0 H${W} V${H} H0 Z M${l},${t} H${r} V${b} H${l} Z')`
  }
})

function cropStart(e) {
  const p = getClientPos(e)
  const cx = cropX.value, cy = cropY.value, cw = cropW.value, ch = cropH.value
  // 判断是否在角落
  const margin = 24
  if (Math.abs(p.x - cx) < margin && Math.abs(p.y - cy) < margin) cropDragCorner = 'nw'
  else if (Math.abs(p.x - cx - cw) < margin && Math.abs(p.y - cy) < margin) cropDragCorner = 'ne'
  else if (Math.abs(p.x - cx) < margin && Math.abs(p.y - cy - ch) < margin) cropDragCorner = 'sw'
  else if (Math.abs(p.x - cx - cw) < margin && Math.abs(p.y - cy - ch) < margin) cropDragCorner = 'se'
  else if (p.x > cx && p.x < cx + cw && p.y > cy && p.y < cy + ch) cropDragCorner = 'move'
  else return
  cropStartX = p.x; cropStartY = p.y
}

function cropMove(e) {
  if (!cropDragCorner) return
  const p = getClientPos(e)
  const dx = p.x - cropStartX; const dy = p.y - cropStartY
  const W = imgW.value || 375; const H = imgH.value || 400
  if (cropDragCorner === 'move') {
    cropX.value = Math.max(0, Math.min(W - cropW.value, cropX.value + dx))
    cropY.value = Math.max(0, Math.min(H - cropH.value, cropY.value + dy))
  } else if (cropDragCorner === 'se') {
    cropW.value = Math.max(60, Math.min(W - cropX.value, cropW.value + dx))
    cropH.value = Math.max(60, Math.min(H - cropY.value, cropH.value + dy))
  } else if (cropDragCorner === 'nw') {
    const nx = Math.max(0, cropX.value + dx); const ny = Math.max(0, cropY.value + dy)
    cropW.value += cropX.value - nx; cropH.value += cropY.value - ny
    cropX.value = nx; cropY.value = ny
    cropW.value = Math.max(60, cropW.value); cropH.value = Math.max(60, cropH.value)
  } else if (cropDragCorner === 'ne') {
    cropY.value = Math.max(0, cropY.value + dy)
    cropW.value = Math.max(60, cropW.value + dx)
    cropH.value += cropStartY - p.y
    cropH.value = Math.max(60, Math.min(H - cropY.value, cropH.value))
  } else if (cropDragCorner === 'sw') {
    cropX.value = Math.max(0, cropX.value + dx)
    cropW.value += cropStartX - p.x
    cropW.value = Math.max(60, Math.min(W - cropX.value, cropW.value))
    cropH.value = Math.max(60, Math.min(H - cropY.value, cropH.value + dy))
  }
  cropStartX = p.x; cropStartY = p.y
  cropped.value = true
}

function cropEnd() { cropDragCorner = null }

function doCrop() {
  return new Promise(resolve => {
    const img = imgRef.value
    if (!img) { resolve(props.src); return }
    const canvas = document.createElement('canvas')
    const scaleX = img.naturalWidth / (imgW.value || 1)
    const scaleY = img.naturalHeight / (imgH.value || 1)
    canvas.width = cropW.value * scaleX
    canvas.height = cropH.value * scaleY
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, cropX.value * scaleX, cropY.value * scaleY, cropW.value * scaleX, cropH.value * scaleY, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.9)
  })
}

// ── 打码 ──
let drawing = false
let mosaicCtx = null

function initMosaicCanvas() {
  const canvas = mosaicCanvas.value
  const img = imgRef.value
  if (!canvas || !img) return
  canvas.width = imgW.value; canvas.height = imgH.value
  canvas.style.width = imgW.value + 'px'; canvas.style.height = imgH.value + 'px'
  mosaicCtx = canvas.getContext('2d')
  mosaicCtx.clearRect(0, 0, canvas.width, canvas.height)
}

function resetMosaic() {
  dirty.value = false
  initMosaicCanvas()
}

function getClientPos(e) {
  const stage = stageRef.value
  const rect = stage.getBoundingClientRect()
  const cx = e.touches ? e.touches[0].clientX : e.clientX
  const cy = e.touches ? e.touches[0].clientY : e.clientY
  return { x: cx - rect.left, y: cy - rect.top }
}

function mosaicStart(e) {
  drawing = true; dirty.value = true
  mosaicMove(e)
}

function mosaicMove(e) {
  if (!drawing || !mosaicCtx) return
  const p = getClientPos(e)
  const r = brushSize.value / 2
  const x = Math.max(r, Math.min((imgW.value || 375) - r, p.x))
  const y = Math.max(r, Math.min((imgH.value || 400) - r, p.y))
  // 马赛克：缩小采样 → 放大还原
  const s = 6
  mosaicCtx.drawImage(imgRef.value, x - r, y - r, brushSize.value, brushSize.value, x - r, y - r, s, s)
  mosaicCtx.drawImage(mosaicCanvas.value, x - r, y - r, s, s, x - r, y - r, brushSize.value, brushSize.value)
}

function doMosaic() {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const img = imgRef.value
    if (!img || !dirty.value) { resolve(props.src); return }
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    // 把马赛克层放大到原图
    const scaleX = img.naturalWidth / (imgW.value || 1)
    const scaleY = img.naturalHeight / (imgH.value || 1)
    ctx.drawImage(mosaicCanvas.value, 0, 0, imgW.value, imgH.value, 0, 0, img.naturalWidth, img.naturalHeight)
    canvas.toBlob(blob => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.9)
  })
}

// ── 完成 ──
async function onDone() {
  if (mode.value === 'crop') {
    if (!cropped.value) return
    const result = await doCrop()
    emit('done', result)
  } else {
    const result = await doMosaic()
    emit('done', result)
  }
}
</script>

<style scoped>
.editor-mask { position: fixed; inset: 0; z-index: 4000; background: #000; display: flex; flex-direction: column; }
.editor-bar { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 16px; color: #fff; flex-shrink: 0; }
.editor-cancel { font-size: 15px; color: #fff; cursor: pointer; }
.editor-title { font-size: 14px; color: #ccc; }
.editor-done { font-size: 15px; color: #48A9A6; font-weight: bold; cursor: pointer; }
.editor-tools { display: flex; gap: 8px; padding: 4px 16px 8px; flex-shrink: 0; }
.tool-btn { padding: 6px 14px; border-radius: 14px; font-size: 13px; color: #aaa; border: 1px solid #555; cursor: pointer; user-select: none; }
.tool-btn.active { color: #48A9A6; border-color: #48A9A6; }
.editor-stage { flex: 1; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.editor-img { max-width: 100%; object-fit: contain; transition: opacity .2s; }
.mosaic-canvas { position: absolute; top: 0; left: 0; }

/* 裁剪 */
.crop-overlay { position: absolute; inset: 0; }
.crop-shade { position: absolute; inset: 0; background: rgba(0,0,0,.45); }
.crop-box { position: absolute; border: 2px solid #48A9A6; box-shadow: 0 0 0 9999px rgba(0,0,0,.45); }
.crop-corner { position: absolute; width: 14px; height: 14px; background: #48A9A6; border: 2px solid #fff; border-radius: 3px; }
.crop-corner.nw { top: -7px; left: -7px; cursor: nw-resize; }
.crop-corner.ne { top: -7px; right: -7px; cursor: ne-resize; }
.crop-corner.sw { bottom: -7px; left: -7px; cursor: sw-resize; }
.crop-corner.se { bottom: -7px; right: -7px; cursor: se-resize; }
</style>
