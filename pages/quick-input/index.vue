<!-- 青付安 — 快速录入 /quick-input · 10秒极简建卡 -->
<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="router.push('/home')">‹ 首页</span>
      <span class="title">快速录入</span>
    </div>

    <div class="hint-card">
      <svg class="hint-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      <span class="hint-text">只填核心信息，10 秒完成，其余可后续补充</span>
    </div>

    <!-- 场景选择 -->
    <span class="label"><span class="star">*</span> 消费场景</span>
    <div class="scene-tags">
      <div class="tag" v-for="s in scenes" :key="s" @click="form.scene = s" :class="{ active: form.scene === s }">{{ s }}</div>
      <div class="tag tag-input-wrap" :class="{ active: isCustomScene }">
        <input v-if="isCustomScene" class="tag-input" v-model="customScene" placeholder="输入场景" @blur="onCustomBlur" ref="customRef" />
        <span v-else @click="startCustom">+ 自定义</span>
      </div>
    </div>

    <!-- 门店名称 -->
    <span class="label"><span class="star">*</span> 门店名称</span>
    <input class="input-blue" v-model="form.storeName" placeholder="如：XX健身工作室" maxlength="30" />

    <!-- 总价 -->
    <span class="label"><span class="star">*</span> 预付总价（元）</span>
    <input class="input-blue" v-model="form.totalPrice" type="text" inputmode="decimal" placeholder="输入实付金额" />

    <!-- 类型切换 -->
    <span class="label">套餐类型</span>
    <div class="type-toggle">
      <div class="type-opt" :class="{ active: !form.unlimited }" @click="form.unlimited = false">次卡</div>
      <div class="type-opt" :class="{ active: form.unlimited }" @click="form.unlimited = true">充卡不限次</div>
    </div>

    <!-- 次数（次卡时显示） -->
    <div v-if="!form.unlimited">
      <span class="label">总次数</span>
      <input class="input-blue" v-model="form.totalTimes" type="number" placeholder="不含赠送次数" />
    </div>

    <!-- 有效期快捷选择 -->
    <span class="label">有效期限</span>
    <div class="term-tags">
      <div class="term-tag" :class="{ active: termPreset === 1 }" @click="setTerm(1)">1 个月</div>
	      <div class="term-tag" :class="{ active: termPreset === 3 }" @click="setTerm(3)">3 个月</div>
      <div class="term-tag" :class="{ active: termPreset === 6 }" @click="setTerm(6)">6 个月</div>
      <div class="term-tag" :class="{ active: termPreset === 12 }" @click="setTerm(12)">12 个月</div>
      <div class="term-tag" :class="{ active: termPreset === 24 }" @click="setTerm(24)">24 个月</div>
      <div class="term-tag term-custom" :class="{ active: termPreset === 0 }" @click="termPreset = 0">
        <input v-if="termPreset === 0" class="term-input" v-model="form.validityValue" type="number" placeholder="数字" ref="termRef" />
        <select v-if="termPreset === 0" class="term-unit" v-model="form.validityUnit" @click.stop>
          <option value="day">天</option>
          <option value="month">月</option>
          <option value="year">年</option>
        </select>
        <span v-else>自定义</span>
      </div>
    </div>

    <div class="btn-create" @click="doCreate">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      直接创建资产卡
    </div>
    <span class="disclaimer">创建后可在资产详情中补充更多信息</span>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { addAsset, addFolder } from '@/common/storage.js'
import { track } from '@/common/analytics.js'

const router = useRouter()
const $toast = (msg) => window.__toast?.(msg)

const scenes = ['健身/舞蹈', '培训课程', '摄影套餐', '美容美发']
const form = reactive({
  scene: '',
  storeName: '',
  totalPrice: '',
  unlimited: false,
  totalTimes: '',
  validityValue: '12',
  validityUnit: 'month'
})
const termPreset = ref(12)
const isCustomScene = ref(false)
const customScene = ref('')
const customRef = ref(null)
const termRef = ref(null)

function setTerm(v) {
  termPreset.value = v
  form.validityValue = String(v)
  form.validityUnit = 'month'
}

function startCustom() {
  isCustomScene.value = true
  nextTick(() => customRef.value?.focus())
}
function onCustomBlur() {
  if (customScene.value.trim()) {
    form.scene = customScene.value.trim()
  } else {
    isCustomScene.value = false
  }
}

function doCreate() {
  const errs = []
  if (!form.scene) errs.push('消费场景')
  if (!form.storeName.trim()) errs.push('门店名称')
  const price = parseFloat(form.totalPrice)
  if (!price || price <= 0) errs.push('预付总价')
  if (!form.unlimited && !parseInt(form.totalTimes)) errs.push('总次数')
  if (errs.length) { $toast('请完善：' + errs.join('、')); return }

  const raw = parseInt(form.validityValue) || 12
  const unit = form.validityUnit || 'month'
  const validityMonths = unit === 'day' ? Math.max(1, raw / 30) : unit === 'year' ? raw * 12 : raw
  try {
    const asset = addAsset({
      scene: form.scene,
      name: form.storeName.trim() + '·套餐',
      totalPrice: price,
      totalTimes: form.unlimited ? 999 : (parseInt(form.totalTimes) || 1),
      validityMonths,
      weeklyFreq: 0,
      monthlyBudget: 0,
      storeName: form.storeName.trim(),
      contractName: '',
      payeeName: '',
      refundRule: '',
      transferRule: '',
      pauseRule: '',
      unlimited: form.unlimited,
      noExpiry: false,
      giftTimes: 0,
      usedTimes: 0,
      status: 'active'
    })
    addFolder({ assetId: asset.id, name: form.storeName.trim() + ' · ' + form.scene + ' 凭证', note: '快速录入自动创建' })
    track('快速录入', '创建资产', form.scene, price)
    router.push(`/asset-detail?id=${asset.id}`)
  } catch (e) {
    console.error('快速录入失败:', e)
    $toast('创建失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #fff; padding-bottom: 40px; }
.nav-bar { display: flex; align-items: center; height: 44px; padding: 0 16px; border-bottom: 1px solid #48A9A6; position: relative; }
.back { font-size: 15px; color: #48A9A6; cursor: pointer; z-index: 1; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 17px; font-weight: bold; color: #245957; }

.hint-card { display: flex; align-items: center; gap: 8px; margin: 10px 16px; padding: 10px 14px; background: #F5FAFA; border: 1px dashed #48A9A6; border-radius: 10px; }
.hint-icon { flex-shrink: 0; }
.hint-text { font-size: 12px; color: #4A7A77; }

.label { display: block; font-size: 14px; font-weight: bold; color: #245957; margin: 14px 16px 4px; }
.star { color: #E8686A; }
.input-blue { display: block; width: calc(100% - 32px); margin: 0 16px; height: 44px; background: #fff; border: 1.5px solid #48A9A6; border-radius: 10px; padding: 0 14px; font-size: 15px; color: #245957; outline: none; box-sizing: border-box; }

/* 场景标签 */
.scene-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 16px; }
.tag { height: 32px; padding: 0 16px; border: 1px solid #48A9A6; border-radius: 16px; font-size: 13px; color: #245957; display: flex; align-items: center; cursor: pointer; }
.tag.active { background: #48A9A6; color: #fff; font-weight: bold; }
.tag-input-wrap { min-width: 80px; }
.tag-input { width: 80px; height: 100%; border: none; outline: none; background: transparent; font-size: 13px; color: #245957; }

/* 类型切换 */
.type-toggle { display: flex; margin: 0 16px; border: 1.5px solid #48A9A6; border-radius: 10px; overflow: hidden; }
.type-opt { flex: 1; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #48A9A6; cursor: pointer; transition: .15s; }
.type-opt.active { background: #48A9A6; color: #fff; font-weight: bold; }

/* 期限标签 */
.term-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 16px; }
.term-tag { height: 32px; padding: 0 14px; border: 1px solid #48A9A6; border-radius: 16px; font-size: 13px; color: #245957; display: flex; align-items: center; cursor: pointer; }
.term-tag.active { background: #48A9A6; color: #fff; font-weight: bold; }
.term-custom { min-width: 60px; }
.term-input { width: 44px; height: 100%; border: none; outline: none; background: transparent; font-size: 13px; color: #fff; text-align: center; }
.term-unit { height: 24px; margin-left: 2px; border: none; outline: none; background: rgba(255,255,255,.2); border-radius: 4px; font-size: 11px; color: #fff; cursor: pointer; }
.term-tag.active .term-input::placeholder { color: rgba(255,255,255,.6); }

.btn-create { margin: 24px 16px 0; height: 50px; background: #48A9A6; color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: bold; cursor: pointer; }
.btn-create:active { opacity: 0.85; }
.disclaimer { display: block; text-align: center; font-size: 11px; color: #638F8D; padding: 8px 16px; }
</style>
