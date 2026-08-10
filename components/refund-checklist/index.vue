<template>
  <div class="mask" @click="$emit('close')">
    <div class="modal" @click.stop>
      <span class="title">线下退款材料整理清单</span>
      <div class="close-btn" @click="$emit('close')">✕</div>
      <div class="divider" />
      <div class="disclaimer-box">本工具不代收资金、无线上退款功能，所有数值仅供线下协商参考</div>

      <span class="section-label">理论剩余权益参考值</span>
      <div class="info-box">
        <div class="info-row"><span>已用次数 / 总次数</span><span class="info-val">{{ asset?.usedTimes || 0 }} / {{ asset?.totalTimes || 0 }} 次</span></div>
        <div class="info-row"><span>剩余次数</span><span class="info-val">{{ Math.max(0, (asset?.totalTimes || 0) - (asset?.usedTimes || 0)) }} 次</span></div>
        <div class="info-row"><span>理论应退金额</span><span class="info-val">¥{{ Math.max(0, refundAmount).toLocaleString() }}</span></div>
      </div>

      <span class="section-label">退款协商待确认条款</span>
      <div class="clause-list">
        <div class="clause-item" v-for="(c, i) in clauses" :key="i">
          <span class="clause-num">{{ i + 1 }}</span>
          <span class="clause-text">{{ c }}</span>
        </div>
      </div>

      <div class="divider" />
      <div class="btn-row">
        <div class="btn-primary flex-1" @click="goEvidence">前往证据资料夹</div>
        <div class="btn-cancel flex-1" @click="$emit('close')">关闭</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ asset: Object })
const emit = defineEmits(['close'])
const router = useRouter()

const refundAmount = computed(() => {
  const a = props.asset
  if (!a) return 0
  const remaining = Math.max(0, (a.totalTimes || 0) - (a.usedTimes || 0))
  return Math.round(remaining * (a.totalPrice || 0) / (a.totalTimes || 1))
})

const clauses = [
  '核对合同原件中的退款条款与计算口径是否一致',
  '准备付款凭证截图（微信 / 支付宝 / 银行转账记录）',
  '打印或导出核销打卡记录明细清单',
  '如商家已关闭，拍摄门店现状照片作为证据',
  '准备本人身份证复印件（供商家核实身份用）',
  '整理商家违约证据（停业通知、聊天记录、承诺截图）',
]

function goEvidence() {
  emit('close')
  router.push('/evidence-folder')
}
</script>

<style scoped>
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(36,89,87,.45); display: flex; align-items: center; justify-content: center; }
.modal { width: 343px; max-height: 80vh; overflow-y: auto; background: #fff; border: 1.5px solid #48A9A6; border-radius: 16px; padding: 20px 24px 24px; position: relative; }
.title { display: block; text-align: center; font-size: 18px; font-weight: bold; color: #245957; }
.close-btn { position: absolute; top: 20px; right: 24px; font-size: 16px; color: #638F8D; cursor: pointer; }
.divider { height: 1px; background: #48A9A6; margin: 12px 0; opacity: 0.4; }
.disclaimer-box { padding: 10px 14px; background: #B8E6E1; border-radius: 8px; font-size: 11px; font-weight: bold; color: #245957; text-align: center; margin-bottom: 12px; line-height: 1.5; }
.section-label { display: block; font-size: 15px; font-weight: bold; color: #245957; margin: 14px 0 8px; }
.info-box { padding: 12px 14px; background: #B8E6E1; border: 1.5px solid #48A9A6; border-radius: 12px; }
.info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #245957; }
.info-val { font-weight: bold; color: #245957; }
.clause-list { display: flex; flex-direction: column; gap: 8px; }
.clause-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: #F5FAFA; border: 1.5px solid #48A9A6; border-radius: 10px; }
.clause-num { width: 22px; height: 22px; background: #48A9A6; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }
.clause-text { font-size: 13px; color: #245957; line-height: 1.5; padding-top: 2px; }
.btn-row { display: flex; gap: 10px; margin-top: 4px; }
.flex-1 { flex: 1; }
.btn-primary { height: 44px; background: #48A9A6; color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: none; cursor: pointer; }
.btn-primary:active { transform: scale(0.96); background: #9FD8D2; }
.btn-cancel { height: 44px; border: 1.5px solid #48A9A6; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #245957; background: #fff; cursor: pointer; }
.btn-cancel:active { transform: scale(0.96); background: #B8E6E1; }
</style>
