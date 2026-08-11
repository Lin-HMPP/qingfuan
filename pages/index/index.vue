<template>
  <div class="page">
    <!-- 顶栏 -->
    <div class="nav-bar">
      <span class="logo">青付安</span>
      <div class="nav-icons">
        <div class="icon-quick" @click="showQuickDialog = true" title="快速录入：10秒极简建卡">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div class="icon-dot" />
        <div class="icon-avatar" />
      </div>
    </div>

    <!-- 标题区 -->
    <div class="hero">
      <div class="hero-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <h2 class="hero-title">预付消费，看得懂、算得清、管得住</h2>
      <p class="hero-sub">大学生&职场青年预付资金管理助手</p>
      <p class="hero-tag">门店跑路止损 · 卡项过期提醒 · 纠纷一键维权</p>
    </div>

    <!-- 即将到期提醒 -->
    <div class="card-blue expire-card">
      <div class="expire-header" @click="goAssets">
        <span class="expire-title">即将到期提醒</span>
        <span class="arrow-blue" v-if="expiringList.length">查看全部 ›</span>
      </div>
      <div v-if="locked" class="expire-empty">信息已锁定</div>
      <div v-else-if="!expiringList.length" class="expire-empty">暂无即将到期的预付卡<br><span class="expire-hint" @click="goQuickInput">录入第一张卡 ›</span></div>
      <template v-else>
        <div v-for="a in expiringList" :key="a.id" class="expire-item">
          <span class="expire-info" :class="{ urgent: a.remainingDays <= 7 }">{{ a.storeName }} · 剩余{{ a.remainingDays }}天 ｜ 剩余{{ a.remainingTimes }}次</span>
          <div class="btn-writeoff" @click="goWriteOff(a)">核销</div>
          <div class="btn-voucher" @click="goEvidence(a)">凭证</div>
        </div>
      </template>
    </div>

    <!-- 双卡片入口 -->
    <div class="card-row">
      <div class="card-blue card-half" @click="goCheck">
        <div class="card-bar" />
        <svg class="card-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span class="card-title">购买前先检查</span>
        <p class="card-desc">录入套餐信息，测算单次成本</p>
        <p class="card-desc">识别预付消费隐藏风险</p>
        <div class="btn-primary-sm">立即测算</div>
      </div>
      <div class="card-blue card-half" @click="goAssets">
        <div class="card-bar" />
        <svg class="card-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span class="card-title">我的预付资产</span>
        <span class="card-amount">预付总额 {{ locked ? '•••' : totalAmount.toLocaleString() }} 元</span>
        <p class="card-desc">在库储值卡 {{ locked ? '•••' : assetCount }} 张</p>
        <div class="btn-secondary-sm">查看全部卡项</div>
      </div>
    </div>

    <!-- 消费证据资料夹 -->
    <div class="card-blue evidence-card" @click="goEvidenceFolder">
      <div class="card-bar" />
      <svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
      <span class="card-title">消费证据资料夹</span>
      <p class="card-desc-long">归集合同、付款截图、核销记录，纠纷一键导出全套维权凭证</p>
      <span class="link-blue" @click.stop="goNewFolder">新建资料夹 ›</span>
    </div>

    <!-- 常用预付场景 -->
    <span class="section-title">常用预付场景</span>
    <div class="scene-tags">
      <div class="tag" v-for="s in scenes" :key="s" @click="goInput(s)">{{ s }}</div>
      <div class="tag tag-custom" @click="showCustomScene = true">+ 自定义</div>
    </div>

    <p class="disclaimer">本工具仅提供预付消费信息管理，不涉及任何资金托管与线上交易服务</p>

    <scene-custom v-if="showCustomScene" @confirm="onCustomScene" @close="showCustomScene = false" />

    <!-- 快速录入确认弹窗 -->
    <div v-if="showQuickDialog" class="mask" @click="showQuickDialog = false">
      <div class="quick-dialog" @click.stop>
        <svg class="qd-icon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span class="qd-title">快速录入模式</span>
        <span class="qd-desc">仅填写核心信息，10 秒完成建卡<br>其余信息可后续在资产详情中补充</span>
        <div class="qd-btn" @click="goQuickInput">进入快速录入</div>
        <div class="qd-cancel" @click="showQuickDialog = false">取消</div>
      </div>
    </div>

    <!-- 新用户使用指南弹窗 -->
    <div v-if="showHelp" class="help-mask" @click="showHelp = false">
      <div class="help-modal" @click.stop>
        <svg class="help-title-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span class="help-title">使用指南</span>
        <div class="help-title-deco" />
        <div class="help-steps">
          <div class="help-step" v-for="(step, idx) in helpSteps" :key="idx">
            <div class="step-num">{{ idx + 1 }}</div>
            <div class="step-text">
              <span class="step-title">{{ step.title }}</span>
              <span class="step-desc">{{ step.desc }}</span>
            </div>
          </div>
        </div>
        <div class="help-tip">所有数据仅存储在本地，不上传任何服务器。</div>
        <div class="btn-primary" style="height:44px;width:100%;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:6px;font-size:15px;font-weight:bold;background:#48A9A6;color:#fff" @click="dismissHelp">开始使用</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAssets } from '@/common/storage.js'
import { locked } from '@/store/lock.js'
import { track } from '@/common/analytics.js'
import SceneCustom from '@/components/scene-picker/custom.vue'

const router = useRouter()

// ── 新用户引导 ──
const showHelp = ref(false)
const helpSteps = [
  { title: '录卡', desc: '点「购买前先检查」录入套餐信息，或点 ⊕ 快速建卡，10 秒完成' },
  { title: '评估', desc: '自动分析 17 项风险指标，告诉你划不划算、有什么问题、该怎么做' },
  { title: '管理', desc: '随时核销打卡、查看剩余权益，充卡模式自动追踪到店次数' },
  { title: '留证', desc: '上传合同、付款截图等凭证，纠纷时一键打包导出维权报告' },
]
function dismissHelp() {
  showHelp.value = false
  localStorage.setItem('qf_onboarded', '1')
}
onMounted(() => {
  if (!localStorage.getItem('qf_onboarded')) {
    const assets = getAssets()
    if (!assets || !assets.length) {
      setTimeout(() => { showHelp.value = true }, 600)
    }
  }
})
const $toast = (msg) => window.__toast?.(msg)
const showCustomScene = ref(false)
const showQuickDialog = ref(false)
const scenes = ['健身/舞蹈', '培训课程', '摄影套餐', '美容美发']

function guard() {
  if (locked.value) { $toast('信息已锁定，请先解锁'); return false }
  return true
}

const assets = computed(() => getAssets())

function remainingDays(a) {
  const end = new Date(a.createdAt)
  end.setMonth(end.getMonth() + (a.validityMonths || 12))
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
}
function remainingTimes(a) { return (a.totalTimes || 0) - (a.usedTimes || 0) }

const expiringList = computed(() =>
  assets.value.filter(a => a.status !== 'expired' && remainingDays(a) <= 30 && remainingDays(a) > 0)
    .map(a => ({ ...a, remainingDays: remainingDays(a), remainingTimes: remainingTimes(a) }))
    .sort((a, b) => a.remainingDays - b.remainingDays).slice(0, 3)
)
const totalAmount = computed(() => assets.value.reduce((s, a) => s + (a.totalPrice || 0), 0))
const assetCount = computed(() => assets.value.length)

function goQuickInput() { showQuickDialog.value = false; if (!guard()) return; router.push('/quick-input'); track('首页', '快速录入') }
function goCheck() { if (!guard()) return; router.push('/package-input'); track('首页', '点击测算') }
function goAssets() { if (!guard()) return; router.push('/asset-list'); track('首页', '查看资产') }
function goEvidenceFolder() { if (!guard()) return; router.push('/evidence-folder'); track('首页', '打开证据夹') }
function goNewFolder() { if (!guard()) return; router.push('/folder-create'); track('首页', '新建资料夹') }
function goInput(scene) { if (!guard()) return; router.push(`/package-input?scene=${encodeURIComponent(scene)}`); track('首页', '场景点击', scene) }
function goWriteOff(asset) { if (!guard()) return; router.push(`/write-off?id=${asset.id}`) }
function goEvidence(asset) { if (!guard()) return; router.push(`/evidence-folder?assetId=${asset.id}`) }
function onCustomScene(name) {
  showCustomScene.value = false
  router.push(`/package-input?scene=${encodeURIComponent(name)}`)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFFFFF; padding-bottom: 70px; }

.nav-bar { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 16px; border-bottom: 1px solid #48A9A6; background: #fff; }
.logo { font-size: 18px; font-weight: bold; color: #245957; }
.nav-icons { display: flex; align-items: center; gap: 10px; }
.icon-quick { width: 30px; height: 30px; border: 1.5px solid #48A9A6; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
.icon-quick:active { background: #B8E6E1; }
.icon-dot { width: 16px; height: 16px; background: #48A9A6; border-radius: 50%; }
.icon-avatar { width: 20px; height: 20px; background: #48A9A6; border-radius: 50%; }

.hero { padding: 20px 16px 8px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.hero-icon { margin-bottom: 12px; }
.hero-title { font-size: 18px; font-weight: bold; color: #245957; margin: 0 0 4px; }
.hero-sub { font-size: 13px; color: #638F8D; margin: 0; }
.hero-tag { font-size: 11px; color: #638F8D; margin: 2px 0 0; }

.expire-card { margin: 14px 16px 0; padding: 14px 14px 10px; }
.expire-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor: pointer; }
.expire-title { font-size: 15px; font-weight: bold; color: #245957; }
.arrow-blue { font-size: 12px; color: #48A9A6; line-height: 1; }
.expire-item { display: flex; align-items: center; height: 32px; background: #fff; border: 1px solid #48A9A6; border-radius: 6px; padding: 0 10px; margin-bottom: 6px; }
.expire-empty { padding: 16px 0; text-align: center; font-size: 13px; color: #638F8D; }
.expire-hint { color: #48A9A6; font-weight: bold; cursor: pointer; display: inline-block; margin-top: 6px; font-size: 12px; }
.expire-info { flex: 1; font-size: 13px; color: #245957; }
.expire-info.urgent { font-weight: bold; }
.btn-writeoff { width: 44px; height: 22px; background: #48A9A6; color: #fff; font-size: 10px; font-weight: bold; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 4px; }
.btn-voucher { width: 44px; height: 22px; background: #fff; color: #48A9A6; font-size: 10px; font-weight: bold; border: 1px solid #48A9A6; border-radius: 6px; display: flex; align-items: center; justify-content: center; }

.card-row { display: flex; gap: 10px; margin: 14px 16px 0; }
.card-half { flex: 1; padding: 14px 12px 16px; position: relative; cursor: pointer; min-height: 150px; display: flex; flex-direction: column; }
.card-bar { width: 3px; height: 16px; background: #48A9A6; border-radius: 2px; position: absolute; left: 12px; top: 16px; }
.card-icon { position: absolute; right: 12px; top: 14px; opacity: 0.6; }
.card-title { display: block; font-size: 16px; font-weight: bold; color: #245957; margin: 0 0 8px 10px; }
.card-desc { font-size: 11px; color: #638F8D; margin: 0 0 2px 10px; }
.card-amount { display: block; font-size: 13px; font-weight: bold; color: #48A9A6; margin: 0 0 4px 10px; }
.btn-primary-sm { height: 36px; margin-top: auto; background: #48A9A6; color: #fff; font-size: 13px; font-weight: bold; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.btn-secondary-sm { height: 36px; margin-top: auto; background: #fff; color: #48A9A6; font-size: 13px; font-weight: bold; border: 1px solid #48A9A6; border-radius: 6px; display: flex; align-items: center; justify-content: center; }

.evidence-card { margin: 14px 16px 0; padding: 14px 14px 40px; position: relative; cursor: pointer; }
.card-desc-long { font-size: 12px; color: #638F8D; margin: 6px 0 0 10px; line-height: 1.5; }
.link-blue { position: absolute; right: 14px; bottom: 12px; font-size: 12px; font-weight: bold; color: #48A9A6; }

.section-title { display: block; font-size: 13px; font-weight: bold; color: #245957; margin: 16px 16px 10px; }

.scene-tags { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 16px; }
.tag { height: 28px; padding: 0 16px; background: #fff; border: 1px solid #48A9A6; border-radius: 14px; font-size: 12px; color: #245957; display: flex; align-items: center; cursor: pointer; }
.tag:active { background: #B8E6E1; }
.tag-custom { color: #638F8D; width: 100%; justify-content: center; }

.disclaimer { text-align: center; font-size: 10px; color: #638F8D; padding: 20px 16px 8px; }

/* 快速录入弹窗 */
.mask { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; }
.quick-dialog { width: 280px; background: #fff; border-radius: 18px; padding: 28px 24px 20px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,.2); }
.qd-icon { display: block; margin: 0 auto 8px; }
.qd-title { display: block; font-size: 18px; font-weight: bold; color: #245957; margin-bottom: 8px; }
.qd-desc { display: block; font-size: 13px; color: #638F8D; line-height: 1.6; margin-bottom: 20px; }
.qd-btn { height: 46px; background: #48A9A6; color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 10px; }
.qd-btn:active { opacity: 0.85; }
.qd-cancel { height: 36px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #638F8D; cursor: pointer; }

/* 新用户引导弹窗 */
.help-mask { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; }
.help-modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 24px; max-height: 80vh; overflow-y: auto; }
.help-title-icon { display: block; margin: 0 auto 8px; }
.help-title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; margin-bottom: 16px; }
.help-steps { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
.help-step { display: flex; gap: 12px; align-items: flex-start; }
.help-step .step-num { width: 24px; height: 24px; border-radius: 12px; background: #48A9A6; color: #fff; font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.step-text { flex: 1; }
.step-title { display: block; font-size: 14px; font-weight: bold; color: #245957; }
.step-desc { display: block; font-size: 12px; color: #638F8D; margin-top: 2px; line-height: 1.5; }
.help-tip { padding: 10px 14px; margin: 12px 0; background: #B8E6E1; border-radius: 8px; font-size: 12px; color: #245957; text-align: center; }
</style>
