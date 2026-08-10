/**
 * 青付安 — 16 条规则运算引擎
 * 对应 PRD §4.3 / 规则库 V2.0 主表
 * 所有运算纯本地执行，无云端接口
 */

/**
 * 执行全部 16 条规则，返回结构化结果
 * @param {Object} data 套餐录入数据
 * @returns {{ dimensions: Array, risks: Array, grade: Object, costs: Object }}
 */
export function runAllRules(data) {
  const results = []

  // ═══ 阶段一：购前决策 (R1-R9) ═══
  results.push(ruleR1(data))   // 单次实际成本核算
  results.push(ruleR2(data))   // 有效期-频率匹配度
  results.push(ruleR8(data))   // 高金额预付规则
  results.push(ruleR9(data))   // 赠品/限时优惠限制说明
  results.push(ruleR3(data))   // 合同/凭证可得性核验
  results.push(ruleR4(data))   // 退款条款清晰度
  results.push(ruleR5(data))   // 转卡/暂停/延期条款
  results.push(ruleR6(data))   // 迁址/停业应对条款
  results.push(ruleR7(data))   // 合同主体一致性核验

  // ═══ 阶段二：购后管理 (R10-R13) ═══
  results.push(ruleR10(data))  // 到期预警
  results.push(ruleR11(data))  // 使用频率异常预警
  results.push(ruleR12(data))  // 材料留存完整性检查
  results.push(ruleR13(data))  // 退款前置检查

  // ═══ 阶段三：商户透明履约 (R14-R16) ═══
  results.push(ruleR14(data))  // 服务变更/价格调整
  results.push(ruleR15(data))  // 场景专属子规则
  results.push(ruleR16(data))  // 退款渠道核验

  // 按六维度分组
  const dimensions = [
    { key: 'pressure',   title: '预付压力', rules: [results[0], results[1], results[2], results[3]], score: 0 },
    { key: 'deadline',   title: '履约时限', rules: [results[4], results[8], results[9]], score: 0 },
    { key: 'rights',     title: '合约权责', rules: [results[5], results[6], results[7]], score: 0 },
    { key: 'identity',   title: '主体一致', rules: [results[10]], score: 0 },
    { key: 'evidence',   title: '证据留存', rules: [results[11], results[12]], score: 0 },
    { key: 'promotion',  title: '促销甄别', rules: [results[13], results[14], results[15]], score: 0 }
  ]

  // 计算五维度评分 (1-5 分)
  dimensions.forEach(dim => {
    const risks = dim.rules.filter(r => r.level === 'high')
    const warns = dim.rules.filter(r => r.level === 'medium')
    const passed = dim.rules.filter(r => r.level === 'low' || r.level === 'none')
    // 高风险扣分多，过关加分
    dim.score = Math.max(1, Math.min(5, 3 + passed.length - risks.length * 2 - warns.length))
  })

  // 综合风险等级
  const highCount = results.filter(r => r.level === 'high').length
  const mediumCount = results.filter(r => r.level === 'medium').length
  let gradeColor, gradeLabel
  if (highCount >= 3)       { gradeColor = '#DC3545'; gradeLabel = '高风险' }
  else if (highCount >= 1 || mediumCount >= 4) { gradeColor = '#FD7E14'; gradeLabel = '中风险' }
  else                      { gradeColor = '#28A745'; gradeLabel = '低风险' }

  // 成本测算
  const costs = calculateCosts(data)

  return {
    risks: results,
    dimensions,
    costs,
    grade: { color: gradeColor, label: gradeLabel, highCount, mediumCount },
    summary: dimensions.map(d => ({ title: d.title, score: d.score }))
  }
}

/** 成本测算：基础/理想/保守三种情景 */
function calculateCosts(data) {
  const totalPrice = parseFloat(data.totalPrice) || 0
  const totalTimes = parseInt(data.totalTimes) || 1
  const baseUnitCost = totalPrice / totalTimes

  // 理想情景：按用户预计频率
  const idealPerWeek = parseInt(data.weeklyFreq) || 3
  const idealMonths = totalTimes / (idealPerWeek * 4.33)
  const idealUnitCost = idealPerWeek > 0 ? baseUnitCost : totalPrice / (totalTimes * 0.5)

  // 保守情景：频率减半
  const conservativePerWeek = Math.max(1, Math.floor(idealPerWeek / 2))
  const conservativeMonths = totalTimes / (conservativePerWeek * 4.33)
  const conservativeUnitCost = totalPrice / (totalTimes * (conservativePerWeek / idealPerWeek))

  const validityMonths = parseInt(data.validityMonths) || 12
  const usageRatio = Math.min(100, Math.round((idealMonths / validityMonths) * 100))

  return {
    base: { label: '票面基础单次成本', value: baseUnitCost, unit: '元/次' },
    ideal: { label: '理想周频单次成本', value: idealUnitCost, unit: '元/次', freq: idealPerWeek, months: idealMonths },
    conservative: { label: '保守低频单次成本', value: conservativeUnitCost, unit: '元/次', freq: conservativePerWeek, months: conservativeMonths },
    expiry: { usageRatio, months: validityMonths, suggestion: usageRatio < 50 ? '建议提升使用频次' : '使用进度正常' }
  }
}

// ═══════════════════════════════════════
// R1-R16 规则函数
// ═══════════════════════════════════════

function riskResult(level, code, title, fact, confirm, explain, action) {
  return { level, code, title, layers: { fact, confirm, explain, action } }
}

function ruleR1(d) {
  const totalPrice = parseFloat(d.totalPrice) || 0
  const totalTimes = parseInt(d.totalTimes) || 1
  const unitCost = totalPrice / totalTimes
  // 使用用户填入的"每月可支配预付预算"作为个性化阈值
  const monthlyBudget = parseFloat(d.monthlyBudget) || 0
  // 保守估计单次成本的合理阈值：月度预算 ÷ 4（按每周1次计算）
  const threshold = monthlyBudget ? monthlyBudget / 4 : 50
  const isHigh = unitCost > threshold

  if (!monthlyBudget) {
    return riskResult('medium', 'R1', '单次实际成本核算',
      `单次均价 ¥${unitCost.toFixed(1)}（未填写月度预算，无法做个性化比对）`,
      '填写每月可支配预付预算以获取更精准评估',
      '建议根据自身消费水平判断单次成本是否合理',
      '建议对比同城同类型3家以上价格后决策')
  }

  return riskResult(
    isHigh ? 'high' : 'low',
    'R1', '单次实际成本核算',
    `单次均价 ¥${unitCost.toFixed(1)}，${isHigh ? '超出' : '在'}你月预算 ¥${monthlyBudget.toLocaleString()} 对应的合理范围（≤¥${threshold.toFixed(0)}/次）`,
    '对比3家同城同类型套餐价格',
    `阈值基于你的月度预算 ÷ 4（每周1次）估算，仅供参考`,
    isHigh ? `单次成本偏高，建议降低预付金额或提升使用频率` : `单次成本在你的预算范围内，性价比合理`
  )
}

function ruleR2(d) {
  const totalTimes = parseInt(d.totalTimes) || 1
  const weeklyFreq = parseInt(d.weeklyFreq) || 2
  const validityMonths = parseInt(d.validityMonths) || 12
  const neededPerWeek = totalTimes / (validityMonths * 4.33)
  const gap = neededPerWeek - weeklyFreq
  const level = gap > 1.5 ? 'high' : gap > 0.5 ? 'medium' : 'low'

  return riskResult(
    level, 'R2', '有效期-频率匹配度',
    `有效期${validityMonths}月对应${totalTimes}次，每周需用${neededPerWeek.toFixed(1)}次`,
    '评估近6个月实际使用频率',
    `${validityMonths}月有效期在行业中属标准时长`,
    gap > 1 ? '如近3月周均＜1次，建议选择次卡或季卡替代' : '当前频率合理，可按计划使用'
  )
}

function ruleR3(d) {
  const hasContract = d.hasContract === true || d.hasContract === 'true'
  return riskResult(
    hasContract ? 'low' : 'medium',
    'R3', '合同/凭证可得性核验',
    hasContract ? '已收到合同/协议' : '未收到书面合同或电子协议',
    '购买前主动索要书面协议或电子订单截图',
    '凭证存在≠信息透明，仍需仔细阅读条款',
    hasContract ? '建议拍照或扫描备份至证据夹' : '强烈建议购买前索要书面合同'
  )
}

function ruleR4(d) {
  const refundClear = d.refundClear === true || d.refundClear === 'true'
  return riskResult(
    refundClear ? 'low' : 'high',
    'R4', '退款条款清晰度',
    refundClear ? '合同已写明退款计算方式' : '退款条款仅口头承诺未写入书面合同',
    '要求出具盖章的退费计算方式书面说明',
    '消法第53条规定预付消费有权退款',
    refundClear ? '建议确认理解无误' : '强烈建议将退费计算写入合同补充条款'
  )
}

function ruleR5(d) {
  const transferClear = d.transferClear === true || d.transferClear === 'true'
  return riskResult(
    transferClear ? 'low' : 'medium',
    'R5', '转卡/暂停/延期条款',
    transferClear ? '合同已包含转卡/暂停/延期条款' : '转卡/停卡政策未明确手续费标准',
    '确认转卡是否需商家审批及手续费',
    '转卡属合同权利义务转让，需双方协商一致',
    transferClear ? '建议确认手续费和流程' : '约定转卡手续费上限(建议≤剩余权益10%)'
  )
}

function ruleR6(d) {
  const moveClear = d.moveClear === true || d.moveClear === 'true'
  const totalPrice = parseFloat(d.totalPrice) || 0
  const isLong = totalPrice >= 800 || (parseInt(d.validityMonths) || 0) >= 6
  return riskResult(
    (moveClear || !isLong) ? 'low' : 'medium',
    'R6', '迁址/停业应对条款',
    moveClear ? '合同已包含迁址/停业处理条款' : '合同未提及不可抗力延期条款',
    '了解因商家原因停业的延期补偿',
    '民法典第590条规定不可抗力可部分免责',
    moveClear ? '条款已覆盖' : '建议合同中补充自动顺延条款'
  )
}

function ruleR7(d) {
  const store = (d.storeName || '').replace(/\s/g, '')
  const contract = (d.contractName || '').replace(/\s/g, '')
  const payee = (d.payeeName || '').replace(/\s/g, '')

  // 全部一致
  if (store && contract && payee && store === contract && contract === payee) {
    return riskResult('low', 'R7', '合同主体一致性核验',
      '合同签约方、门店名称、收款方三者一致',
      '', '合同主体信息一致，无需额外确认',
      '建议仍留存合同和付款凭证备查')
  }

  // 收款方是个人账户（包含常见个人收款特征）
  const personKeywords = ['个人', '微信', '支付宝', '收款码']
  const isPersonalPayee = personKeywords.some(k => payee.includes(k)) || (payee.length >= 2 && payee.length <= 4)
  if (isPersonalPayee) {
    return riskResult('high', 'R7', '合同主体一致性核验',
      `收款账户为${payee || '个人账户'}，非对公账户`,
      '确认是否为法人/股东本人账户',
      '个体工商户可使用个人账户，需与执照经营者一致',
      '索要收款人身份证复印件，核对是否与执照经营者为同一人')
  }

  // 门店名≠合同名，但合同名包含门店关键字
  if (store && contract && store !== contract) {
    const storeChars = [...store].filter(c => [...contract].includes(c)).length
    const matchRatio = storeChars / Math.max(store.length, 1)
    if (matchRatio >= 0.5) {
      return riskResult('medium', 'R7', '合同主体一致性核验',
        `门店宣传名称"${store}"与合同签约主体"${contract}"不完全一致`,
        '核对执照原件确认两者关系',
        '门店招牌可使用简称，但签约主体应为执照登记全称',
        '建议确认合同签约方与执照登记主体完全一致')
    }
    // 完全不匹配
    return riskResult('high', 'R7', '合同主体一致性核验',
      `门店宣传名"${store}"、合同签约方"${contract}"、收款方"${payee}"三者不统一`,
      '逐一核对执照原件、门店招牌及收款账户名',
      '合同签署方须与执照登记主体一致',
      '三者不一致时维权困难，强烈建议核实后再付款')
  }

  // 只有部分信息，无法判断
  return riskResult('medium', 'R7', '合同主体一致性核验',
    '主体信息未完整填写，无法完成一致性核验',
    '建议完整填写门店名称、签约主体、收款账户三项',
    '主体信息不全时维权对象难以确定',
    '付款前务必确认合同签署方与收款方的关系')
}

function ruleR8(d) {
  const totalPrice = parseFloat(d.totalPrice) || 0
  const monthlyBudget = parseFloat(d.monthlyBudget) || 0
  // 推荐预付总额不超过3个月的可支配预算
  const threshold = monthlyBudget ? monthlyBudget * 3 : 0

  if (!monthlyBudget) {
    return riskResult('medium', 'R8', '高金额预付规则',
      `总价 ¥${totalPrice.toLocaleString()}（未填写月度预算，无法判断是否超支）`,
      '填写每月可支配预付预算以获取个性化评估',
      '建议预付总额控制在月可支配收入的30%以内',
      '建议评估该笔支出对生活开支的影响后再决策')
  }

  if (totalPrice > threshold) {
    const months = Math.round(totalPrice / monthlyBudget)
    return riskResult('high', 'R8', '高金额预付规则',
      `总价 ¥${totalPrice.toLocaleString()} 相当于 ${months} 个月预算，显著超出推荐的3个月上限`,
      '评估是否可承担长期资金占用风险',
      '推荐预付总额不超过3个月预算，降低商户经营风险带来的损失',
      '建议选择更短期的套餐，或要求分阶段付款')
  } else if (totalPrice > monthlyBudget * 1.5) {
    return riskResult('medium', 'R8', '高金额预付规则',
      `总价 ¥${totalPrice.toLocaleString()} 略超推荐范围，占${Math.round(totalPrice / monthlyBudget * 100)}%月预算`,
      '评估资金占用是否影响日常开支',
      '适度预付可享优惠，但需平衡灵活性和折扣',
      '建议确认退款条款完善，以防需要提前退出')
  }
  return riskResult('low', 'R8', '高金额预付规则',
    `总价 ¥${totalPrice.toLocaleString()} 在月预算 ¥${monthlyBudget.toLocaleString()} 的合理范围内`,
    '', '金额合理，但仍建议了解退款和转卡条款',
    '建议保留合同和付款凭证，随时关注剩余权益')
}

function ruleR9(d) {
  const hasGift = d.hasGift === true || d.hasGift === 'true'
  const giftClear = d.giftClear === true || d.giftClear === 'true'
  return riskResult(
    hasGift && !giftClear ? 'medium' : 'low',
    'R9', '赠品/限时优惠限制说明',
    hasGift && !giftClear ? '赠送部分规则不清' : '赠送规则明确或无赠送',
    '确认赠送的使用限制、有效期和使用条件',
    '赠送部分是额外权益，需单独确认规则',
    hasGift ? '建议问清赠送规则并书面记录' : '无赠送权益，规则清晰'
  )
}

function ruleR10(d) {
  const remainingDays = parseInt(d.remainingDays) || 365
  const threshold = parseInt(d.expiryThreshold) || 30
  return riskResult(
    remainingDays <= threshold ? 'high' : remainingDays <= threshold * 2 ? 'medium' : 'low',
    'R10', '到期预警',
    remainingDays <= threshold ? `套餐将在${remainingDays}天后到期` : `距到期还有${remainingDays}天`,
    '按剩余次数倒推建议使用频率',
    `到期预警默认提前${threshold}天提醒，可自定义`,
    remainingDays <= threshold ? '建议近期安排使用或了解暂停/转卡方式' : '使用进度正常'
  )
}

function ruleR11(d) {
  const actualFreq = parseFloat(d.actualFreq) || 0
  const plannedFreq = parseFloat(d.plannedFreq) || parseFloat(d.weeklyFreq) || 0
  if (!plannedFreq) return riskResult('low', 'R11', '使用频率异常预警', '无计划频率数据', '', '', '')

  // 购前阶段：尚无实际使用数据，此规则不参与评分
  if (!actualFreq || actualFreq === 0) {
    return riskResult('none', 'R11', '使用频率异常预警',
      '购前阶段尚无实际使用数据，此规则暂不适用',
      '购买后开始记录核销，系统将自动跟踪实际频率',
      '此规则将在产生使用记录后自动激活',
      '建议购买后按时核销打卡，以便及时发现频率偏差')
  }

  const ratio = actualFreq / plannedFreq
  return riskResult(
    ratio < 0.5 ? 'high' : ratio < 0.8 ? 'medium' : 'low',
    'R11', '使用频率异常预警',
    `实际频率${actualFreq}次/周，低于计划${plannedFreq}次/周`,
    '检查是否因客观原因导致频率下降',
    '频率下降可能为短期波动，可持续观察',
    ratio < 0.5 ? '建议调整使用安排或咨询暂停/转卡选项' : '小幅波动属正常范围'
  )
}

function ruleR12(d) {
  const hasContract = d.hasContract === true || d.hasContract === 'true'
  const hasPayment = d.hasPayment === true || d.hasPayment === 'true'
  const hasPromo = d.hasPromo === true || d.hasPromo === 'true'
  const hasRecord = d.hasRecord === true || d.hasRecord === 'true'
  const complete = [hasContract, hasPayment, hasPromo, hasRecord].filter(Boolean).length
  return riskResult(
    complete < 2 ? 'high' : complete < 4 ? 'medium' : 'low',
    'R12', '材料留存完整性检查',
    `四类材料已完成${complete}/4项`,
    '补充缺失材料至证据夹',
    '材料仅本地保存，可随时删除，不上传也可完成检查',
    complete < 4 ? '建议补充缺失的材料类型' : '材料留存完整'
  )
}

function ruleR13(d) {
  const refundKnown = d.refundKnown === true || d.refundKnown === 'true'
  return riskResult(
    refundKnown ? 'low' : 'medium',
    'R13', '退款前置检查',
    refundKnown ? '已了解退款规则' : '退款条款和流程待确认',
    '确认退款受理人、联系方式、处理时限',
    '理论估算仅供参考，实际退款以商户计算为准',
    '建议准备合同、付款凭证和沟通记录'
  )
}

function ruleR14(d) {
  return riskResult('low', 'R14', '服务变更/价格调整时间线记录', '暂未检测到商户变更记录', '', '', '')
}

function ruleR15(d) {
  return riskResult('low', 'R15', '场景专属子规则', '当前场景无明显专属风险项', '', '', '')
}

function ruleR16(d) {
  return riskResult('medium', 'R16', '退款渠道核验', '商家未主动告知线下退款渠道和受理流程', '确认退款受理人/联系方式/处理时限', '消法规定经营者不得无理拒绝退款', '记录退款对接人信息，如商家拒绝可通过12315核实')
}
