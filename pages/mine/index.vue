<template>
  <div class="page">
    <div class="nav-bar"><span class="title">我的</span></div>

    <div class="card-blue user-card">
      <div class="avatar-outline">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#48A9A6" stroke-width="1.5" stroke-linecap="round"><circle cx="16" cy="11" r="5"/><path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10"/></svg>
      </div>
      <span class="user-name">青付安用户</span>
      <span class="user-status">{{ locked ? '信息已隐藏' : '信息可见' }}</span>
      <div class="lock-btn" :class="{ locked: locked }" @click="toggleLock">
        {{ locked ? '解锁' : '锁定信息' }}
      </div>
    </div>

    <div class="card-blue stats-card">
      <div class="stat-col" v-for="(s, i) in stats" :key="i">
        <span class="stat-value" :class="{ hidden: locked }">{{ locked ? '•••' : s.value }}</span>
        <span class="stat-label">{{ s.label }}</span>
        <div v-if="i < 2" class="stat-divider" />
      </div>
    </div>

    <div class="card-blue menu-card">
      <div class="menu-item" v-for="(m, i) in menus" :key="i" @click="onMenu(m)">
        <span class="menu-text">{{ m }}</span><span class="arrow-blue">›</span>
        <div v-if="i < menus.length - 1" class="divider-blue menu-divider" />
      </div>
    </div>

    <!-- 使用帮助弹窗 -->
    <div v-if="showHelp" class="help-mask" @click="showHelp = false">
      <div class="help-modal" @click.stop>
        <span class="help-title">📖 使用帮助</span>
        <div class="help-steps">
          <div class="help-step">
            <div class="step-num">1</div>
            <div class="step-text">
              <span class="step-title">录入套餐信息</span>
              <span class="step-desc">填写商家名称、预付金额、服务次数和使用期限</span>
            </div>
          </div>
          <div class="help-step">
            <div class="step-num">2</div>
            <div class="step-text">
              <span class="step-title">查看决策评估</span>
              <span class="step-desc">系统自动分析 16 项风险指标，帮你判断值不值得办卡</span>
            </div>
          </div>
          <div class="help-step">
            <div class="step-num">3</div>
            <div class="step-text">
              <span class="step-title">确认生成资产</span>
              <span class="step-desc">确认后预付卡会加入资产列表，可随时查看剩余次数和到期时间</span>
            </div>
          </div>
          <div class="help-step">
            <div class="step-num">4</div>
            <div class="step-text">
              <span class="step-title">日常核销打卡</span>
              <span class="step-desc">每次到店消费后打卡扣次，系统自动更新剩余权益</span>
            </div>
          </div>
          <div class="help-step">
            <div class="step-num">5</div>
            <div class="step-text">
              <span class="step-title">管理证据材料</span>
              <span class="step-desc">上传合同、付款截图、聊天记录，纠纷时一键打包导出维权材料</span>
            </div>
          </div>
        </div>
        <div class="help-tip">
          💡 所有数据仅存储在本地手机中，不上传任何服务器
        </div>
        <div class="btn-primary" @click="showHelp = false">知道了</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAssets } from '@/common/storage.js'
import { locked, doLock } from '@/store/lock.js'

function toggleLock() {
  if (locked.value) {
    window.__showPin?.('verify')
  } else {
    localStorage.removeItem('qf_pin_hash')
    localStorage.removeItem('qf_unlocked')
    doLock()
    window.__showPin?.('setup')
  }
}

const menus = ['使用帮助', '隐私设置', '本地凭证管理', '重置所有数据']
const showHelp = ref(false)

function onMenu(m) {
  if (m === '使用帮助') { showHelp.value = true }
  else if (m === '隐私设置') alert('所有数据仅本地存储，不上传服务器。\n\n支持 PIN 码锁定保护敏感信息。')
  else if (m === '本地凭证管理') alert('所有凭证文件仅保存在本机。\n换设备不会自动同步。')
  else if (m === '重置所有数据') {
    if (window.confirm('确认重置？\n\n这将清除所有资产、核销记录、PIN码等本地数据。此操作不可恢复！')) {
      localStorage.clear()
      location.reload()
    }
  }
}

const statsData = ref({ totalAmount: 0, count: 0, pending: 0 })
function refresh() {
  const a = getAssets()
  statsData.value = { totalAmount: a.reduce((s,x)=>s+(x.totalPrice||0),0), count: a.length, pending: a.filter(x=>x.status==='dispute').length }
}
onMounted(() => { refresh(); window.addEventListener('app-unlocked', refresh) })
const stats = computed(() => [
  { label: '总资产金额', value: '¥'+statsData.value.totalAmount.toLocaleString() },
  { label: '卡项总数', value: statsData.value.count+' 张' },
  { label: '待维权', value: statsData.value.pending+' 件' }
])
</script>

<style scoped>
.page { min-height: 100vh; background: #F5FAFA; }
.nav-bar { display: flex; align-items: center; height: 44px; background: #fff; padding: 0 16px; border-bottom: 1px solid #48A9A6; justify-content: center; }
.title { font-size: 18px; font-weight: bold; color: #245957; }
.user-card { margin: 16px; padding: 22px 14px; display: flex; align-items: center; position: relative; }
.avatar-outline { width: 56px; height: 56px; border: 1.5px solid #48A9A6; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-right: 14px; background: #B8E6E1; }
.user-name { font-size: 16px; font-weight: bold; color: #245957; }
.user-status { display: block; font-size: 12px; color: #4A7A77; margin-top: 2px; }
.lock-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); height: 28px; padding: 0 16px; background: #48A9A6; color: #fff; font-size: 11px; font-weight: bold; border-radius: 14px; display: flex; align-items: center; cursor: pointer; transition: transform .1s ease; }
.lock-btn:active { transform: translateY(-50%) scale(.93); }
.lock-btn.locked { background: #fff; color: #48A9A6; border: 1.5px solid #48A9A6; }
.stats-card { margin: 0 16px; padding: 16px 0; display: flex; }
.stat-col { flex: 1; text-align: center; position: relative; }
.stat-value { display: block; font-size: 18px; font-weight: bold; color: #245957; }
.stat-value.hidden { color: #4A7A77; letter-spacing: 4px; font-size: 16px; }
.stat-label { display: block; font-size: 12px; color: #4A7A77; margin-top: 4px; }
.stat-divider { position: absolute; right: 0; top: 0; width: 0.5px; height: 48px; background: #48A9A6; opacity: .5; }
.menu-card { margin: 16px; padding: 0; }
.menu-item { display: flex; align-items: center; height: 48px; padding: 0 14px; position: relative; cursor: pointer; transition: background .1s; }
.menu-item:active { background: #B8E6E1; }
.menu-text { flex: 1; font-size: 15px; color: #245957; }
.arrow-blue { font-size: 18px; color: #48A9A6; }
.menu-divider { position: absolute; bottom: 0; left: 14px; right: 0; }

.help-mask { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.help-modal { width: 343px; background: #fff; border: 1px solid #48A9A6; border-radius: 16px; padding: 24px; max-height: 80vh; overflow-y: auto; }
.help-title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; margin-bottom: 20px; }
.help-steps { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
.help-step { display: flex; gap: 12px; align-items: flex-start; }
.step-num { width: 24px; height: 24px; border-radius: 12px; background: #48A9A6; color: #fff; font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.step-text { flex: 1; }
.step-title { display: block; font-size: 14px; font-weight: bold; color: #245957; }
.step-desc { display: block; font-size: 12px; color: #638F8D; margin-top: 2px; line-height: 1.5; }
.help-tip { padding: 10px 14px; margin: 12px 0; background: #B8E6E1; border-radius: 8px; font-size: 12px; color: #245957; text-align: center; }
.help-modal .btn-primary { height: 44px; background: #48A9A6; color: #fff; border-radius: 8px; font-size: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; width: 100%; }
.help-modal .btn-primary:active { opacity: .85; }
</style>
