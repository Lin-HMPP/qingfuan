<template>
  <div class="editor-mask" @touchmove.prevent>
    <div class="editor-bar">
      <span class="editor-cancel" @click="$emit('cancel')">取消</span>
      <span class="editor-title">{{ mode === 'mosaic' ? '打码 · 涂抹隐私区域' : '裁剪 · 拖动选框' }}</span>
      <span class="editor-done" @click="onDone">{{ mode === 'crop' && !cropped ? '' : '完成' }}</span>
    </div>

    <div class="editor-tools">
      <div class="tool-btn" :class="{ active: mode === 'mosaic' }" @click="mode = 'mosaic'">打码</div>
      <div class="tool-btn" :class="{ active: mode === 'crop' }" @click="mode = 'crop'">裁剪</div>
      <div class="tool-btn" v-if="mode === 'mosaic'" @click="brushSize = brushSize === 24 ? 42 : brushSize === 42 ? 60 : 24">
        画笔 {{ brushSize === 24 ? '小' : brushSize === 42 ? '中' : '大' }}
      </div>
      <div class="tool-btn" v-if="dirty" @click="undo">撤销</div>
    </div>

    <div class="editor-canvas-wrap" ref="wrapRef">
      <canvas ref="canvasRef" @touchstart="onStart" @touchmove="onMove" @touchend="onEnd"
        @mousedown="onStart" @mousemove="onMove" @mouseup="onEnd" @mouseleave="onEnd" />
    </div>

    <!-- 裁剪确认 -->
    <div class="crop-actions" v-if="mode === 'crop' && cropped">
      <div class="tool-btn active" @click="confirmCrop">确认裁剪</div>
      <div class="tool-btn" @click="resetCrop">重新选区</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({ src: String })
const emit = defineEmits(['done', 'cancel'])

const canvasRef = ref(null)
const wrapRef = ref(null)
const mode = ref('mosaic')
const brushSize = ref(24)
const dirty = ref(false)
const cropped = ref(false)

let img = null
let displayW = 0, displayH = 0
let scale = 1     // canvas → 原图比例
let offsetX = 0, offsetY = 0
let drawing = false
let cropRect = null  // { x, y, w, h } 裁剪框（canvas坐标）
let dragCorner = null
let dragStart = null

onMounted(async () => {
  img = new Image()
  img.onload = () => { initCanvas() }
  img.src = props.src
})

function initCanvas() {
  const wrap = wrapRef.value
  const maxW = wrap.clientWidth - 16
  const maxH = 380
  const ratio = img.width / img.height
  if (ratio > maxW / maxH) {
    displayW = maxW; displayH = maxW / ratio
  } else {
    displayH = maxH; displayW = maxH * ratio
  }
  scale = img.width / displayW
  const canvas = canvasRef.value
  canvas.width = displayW
  canvas.height = displayH
  canvas.style.width = displayW + 'px'
  canvas.style.height = displayH + 'px'
  offsetX = (maxW - displayW) / 2
  draw()
}

function draw() {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  if (mode.value === 'crop' && cropRect) {
    ctx.strokeStyle = '#48A9A6'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 3])
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h)
    // 暗角
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, canvas.width, cropRect.y)
    ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.h)
    ctx.fillRect(cropRect.x + cropRect.w, cropRect.y, canvas.width - cropRect.x - cropRect.w, cropRect.h)
    ctx.fillRect(0, cropRect.y + cropRect.h, canvas.width, canvas.height - cropRect.y - cropRect.h)
  }
}

// ── 打码 ──
function getPos(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function onStart(e) {
  if (mode.value === 'crop') {
    startCrop(getPos(e))
    return
  }
  drawing = true
  dirty.value = true
  applyMosaic(getPos(e))
}

function onMove(e) {
  if (!drawing && !dragCorner) return
  const pos = getPos(e)
  if (mode.value === 'crop' && dragCorner) {
    updateCrop(pos)
    return
  }
  applyMosaic(pos)
}

function onEnd() { drawing = false; dragCorner = null; dragStart = null }

function applyMosaic(pos) {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const r = brushSize.value / 2
  const x = Math.max(r, Math.min(canvas.width - r, pos.x))
  const y = Math.max(r, Math.min(canvas.height - r, pos.y))

  // 取原图对应区域放大再缩小 → 马赛克效果
  const sx = (x - r) * scale, sy = (y - r) * scale
  const sw = brushSize.value * scale, sh = brushSize.value * scale

  // 缩小采样 → 放大还原 → 马赛克
  const sampleSize = 8
  ctx.drawImage(img, sx, sy, sw, sh, x - r, y - r, sampleSize, sampleSize)
  ctx.drawImage(canvas, x - r, y - r, sampleSize, sampleSize, x - r, y - r, brushSize.value, brushSize.value)
}

// ── 裁剪 ──
function startCrop(pos) {
  if (cropped.value) { resetCrop(); return }
  dragCorner = 'br'
  dragStart = pos
  const size = Math.min(canvasRef.value.width, canvasRef.value.height) * 0.6
  cropRect = { x: Math.max(0, pos.x - size / 2), y: Math.max(0, pos.y - size / 2), w: size, h: size }
  cropRect.x = Math.min(cropRect.x, canvasRef.value.width - cropRect.w)
  cropRect.y = Math.min(cropRect.y, canvasRef.value.height - cropRect.h)
  draw()
  cropped.value = true
}

function updateCrop(pos) {
  if (!cropRect) return
  cropRect.w = Math.max(40, pos.x - cropRect.x)
  cropRect.h = Math.max(40, pos.y - cropRect.y)
  cropRect.w = Math.min(cropRect.w, canvasRef.value.width - cropRect.x)
  cropRect.h = Math.min(cropRect.h, canvasRef.value.height - cropRect.y)
  draw()
}

function confirmCrop() {
  if (!cropRect) return
  const canvas = document.createElement('canvas')
  const rw = cropRect.w * scale, rh = cropRect.h * scale
  canvas.width = rw
  canvas.height = rh
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, cropRect.x * scale, cropRect.y * scale, rw, rh, 0, 0, rw, rh)
  canvas.toBlob(blob => {
    const reader = new FileReader()
    reader.onload = () => emit('done', reader.result)
    reader.readAsDataURL(blob)
  }, 'image/jpeg', 0.92)
}

function resetCrop() { cropRect = null; cropped.value = false; draw() }

// ── 完成（打码模式直接导出） ──
function onDone() {
  if (mode.value === 'crop' && cropped.value) { confirmCrop(); return }
  if (mode.value === 'crop' && !cropped.value) return
  canvasRef.value.toBlob(blob => {
    const reader = new FileReader()
    reader.onload = () => emit('done', reader.result)
    reader.readAsDataURL(blob)
  }, 'image/jpeg', 0.92)
}

function undo() {
  dirty.value = false
  initCanvas()
}
</script>

<style scoped>
.editor-mask { position: fixed; inset: 0; z-index: 4000; background: #000; display: flex; flex-direction: column; }
.editor-bar { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 16px; color: #fff; flex-shrink: 0; }
.editor-cancel { font-size: 15px; color: #fff; cursor: pointer; }
.editor-title { font-size: 14px; color: #ccc; }
.editor-done { font-size: 15px; color: #48A9A6; font-weight: bold; cursor: pointer; }
.editor-tools { display: flex; gap: 8px; padding: 0 16px 8px; flex-shrink: 0; }
.tool-btn { padding: 6px 14px; border-radius: 14px; font-size: 13px; color: #aaa; border: 1px solid #555; cursor: pointer; user-select: none; }
.tool-btn.active { color: #48A9A6; border-color: #48A9A6; }
.editor-canvas-wrap { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 8px; }
.crop-actions { display: flex; gap: 12px; justify-content: center; padding: 12px; flex-shrink: 0; }
</style>
