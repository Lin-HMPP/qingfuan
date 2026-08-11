/**
 * 青付安 演示数据注入脚本
 * 用法：浏览器打开 https://lin-hmpp.github.io/qingfuan/ → F12 控制台 → 粘贴执行
 * 执行前确保当前无重要数据（会覆盖同名 key）
 */

(function () {
  // ── 工具 ──
  const now = Date.now()
  const day = 86400000
  const ts = (offsetDays = 0) => new Date(now + offsetDays * day).toISOString()

  function id(prefix) {
    return prefix + '_' + now + '_' + Math.random().toString(36).slice(2, 6)
  }

  // ── 1. 创建 4 张资产卡 ──

  // 卡 A：健身年卡（普通次卡，快到期，使用率偏低 → 触发预警）
  const astA = {
    id: id('ast'),
    scene: '健身/舞蹈',
    name: 'XX健身工作室·套餐',
    storeName: 'XX健身工作室',
    contractName: 'XX体育文化发展有限公司',
    payeeName: 'XX体育文化发展有限公司',
    totalPrice: 2880,
    totalTimes: 96,
    usedTimes: 22,
    giftTimes: 2,
    validityMonths: 12,
    weeklyFreq: 3,
    monthlyBudget: 500,
    unlimited: false,
    noExpiry: false,
    refundRule: '未开卡全额退，已开卡按已消费次数比例退',
    transferRule: '可转卡，收手续费 10%',
    pauseRule: '可请假暂停，无额外限制',
    groupBuyPlatform: '',
    status: 'active',
    createdAt: ts(-345),
    updatedAt: ts(-1),
  }

  // 卡 B：考研培训班（普通次卡，使用正常，有效期还很长）
  const astB = {
    id: id('ast'),
    scene: '培训课程',
    name: 'XX考研·套餐',
    storeName: 'XX考研 · 大学城校区',
    contractName: 'XX教育科技有限公司',
    payeeName: 'XX教育科技有限公司',
    totalPrice: 15800,
    totalTimes: 160,
    usedTimes: 78,
    giftTimes: 10,
    validityMonths: 12,
    weeklyFreq: 3,
    monthlyBudget: 2000,
    unlimited: false,
    noExpiry: false,
    refundRule: '未开课全额退，已开课按剩余课时比例退',
    transferRule: '可转让，不收转让费',
    pauseRule: '可申请休学，无附加条件',
    groupBuyPlatform: '',
    status: 'active',
    createdAt: ts(-180),
    updatedAt: ts(-3),
  }

  // 卡 C：美发充年卡（无限次模式，有打卡记录）
  const astC = {
    id: id('ast'),
    scene: '美容美发',
    name: 'XX美发沙龙·套餐',
    storeName: 'XX美发沙龙 · 太古里店',
    contractName: 'XX美容美发管理有限公司',
    payeeName: '美团商家平台',
    totalPrice: 3800,
    totalTimes: 999,
    usedTimes: 16,
    giftTimes: 0,
    validityMonths: 12,
    weeklyFreq: 2,
    monthlyBudget: 400,
    unlimited: true,
    noExpiry: false,
    refundRule: '未开卡全额退，已开卡按已消费次数比例退',
    transferRule: '不可转卡',
    pauseRule: '可暂停，无额外限制',
    groupBuyPlatform: 'meituan',
    status: 'active',
    createdAt: ts(-200),
    updatedAt: ts(-2),
  }

  // 卡 D：摄影套餐（已暂停状态）
  const astD = {
    id: id('ast'),
    scene: '摄影套餐',
    name: 'XX婚纱摄影·套餐',
    storeName: 'XX婚纱摄影 · 旗舰店',
    contractName: 'XX摄影服务有限公司',
    payeeName: '抖音团购商家平台',
    totalPrice: 6999,
    totalTimes: 4,
    usedTimes: 1,
    giftTimes: 0,
    validityMonths: 6,
    weeklyFreq: 0,
    monthlyBudget: 0,
    unlimited: false,
    noExpiry: false,
    refundRule: '未拍摄全额退，已拍摄按未拍套数比例退',
    transferRule: '可转单，不收手续费',
    pauseRule: '可免费延期一次',
    groupBuyPlatform: 'douyin',
    status: 'paused',
    createdAt: ts(-150),
    updatedAt: ts(-30),
  }

  const assets = [astA, astB, astC, astD]
  localStorage.setItem('qf_assets', JSON.stringify(assets))

  // ── 2. 核销记录 ──
  const writeoffs = [
    // 卡A 健身——22次核销记录
    ...Array.from({ length: 22 }, (_, i) => ({
      id: 'wo_' + (now - (21 - i) * 300000),
      assetId: astA.id,
      date: new Date(now - (22 - i) * 3 * day).toISOString().slice(0, 10),
      hours: 1,
      note: ['腿部训练', '背部训练', '有氧', '私教课', '自由训练', '拉伸课'][i % 6],
      remainingAfter: 96 + 2 - (i + 1),
      createdAt: new Date(now - (21 - i) * 300000).toISOString(),
    })),
    // 卡B 培训——78课时记录
    ...Array.from({ length: 78 }, (_, i) => ({
      id: 'wo_' + (now - (77 - i) * 300000),
      assetId: astB.id,
      date: new Date(now - (78 - i) * 2 * day).toISOString().slice(0, 10),
      hours: 1,
      note: ['英语阅读', '政治', '数学', '专业课', '写作', '模拟考'][i % 6],
      remainingAfter: 160 + 10 - (i + 1),
      createdAt: new Date(now - (77 - i) * 300000).toISOString(),
    })),
    // 卡C 美发——16次打卡
    ...Array.from({ length: 16 }, (_, i) => ({
      id: 'wo_' + (now - (15 - i) * 500000),
      assetId: astC.id,
      date: new Date(now - (16 - i) * 7 * day).toISOString().slice(0, 10),
      hours: 1,
      note: ['洗剪吹', '染发', '护理', '烫发', '剪发', '头皮护理'][i % 6],
      remainingAfter: i + 1,
      createdAt: new Date(now - (15 - i) * 500000).toISOString(),
    })),
    // 卡D 摄影——1次拍摄
    {
      id: 'wo_' + (now - 2000000),
      assetId: astD.id,
      date: new Date(now - 60 * day).toISOString().slice(0, 10),
      hours: 1,
      note: '内景拍摄',
      remainingAfter: 3,
      createdAt: new Date(now - 2000000).toISOString(),
    },
  ]
  localStorage.setItem('qf_writeoffs', JSON.stringify(writeoffs))

  // ── 3. 暂停记录 ──
  const pauses = [
    {
      id: id('pau'),
      assetId: astD.id,
      type: 'pause',
      start: new Date(now - 30 * day).toISOString().slice(0, 10),
      end: new Date(now + 60 * day).toISOString().slice(0, 10),
      note: '冬季延期，3月恢复拍摄',
      createdAt: ts(-30),
    },
  ]
  localStorage.setItem('qf_pauses', JSON.stringify(pauses))

  // ── 4. 资料夹（每张卡一个） ──
  const folders = assets.map(a => ({
    id: id('fld'),
    assetId: a.id,
    name: a.storeName + ' 凭证',
    note: '自动创建',
    createdAt: a.createdAt,
  }))

  // 卡A多一个手动建的资料夹
  folders.push({
    id: id('fld'),
    assetId: astA.id,
    name: 'XX健身 · 退费沟通记录',
    note: '2026年3月跟销售沟通退费的记录',
    createdAt: ts(-60),
  })

  localStorage.setItem('qf_folders', JSON.stringify(folders))

  // ── 5. 证据文件 ──
  // 用极简 SVG base64 做占位图（中文需先 TextEncoder 编码再 btoa）
  function makePlaceholder(label) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#B8E6E1"/><text x="200" y="155" text-anchor="middle" fill="#48A9A6" font-size="16" font-family="sans-serif">' + label + '</text></svg>'
    var bytes = new TextEncoder().encode(svg)
    var bin = ''
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return 'data:image/svg+xml;base64,' + btoa(bin)
  }

  const files = [
    // 卡A 文件夹1 — 有合同和付款截图，缺宣传材料和核销记录
    { folderId: folders[0].id, name: '健身合同_2025.pdf', type: 'pdf', size: '1.2MB', materialType: 'contract', dataUrl: makePlaceholder('合同扫描件'), mimeType: 'image/png' },
    { folderId: folders[0].id, name: '微信支付截图.jpg', type: 'image', size: '245KB', materialType: 'payment', dataUrl: makePlaceholder('付款截图'), mimeType: 'image/jpeg' },
    // 卡B 文件夹2 — 合同+付款+聊天记录+核销记录（较完整）
    { folderId: folders[1].id, name: '培训协议.pdf', type: 'pdf', size: '2.5MB', materialType: 'contract', dataUrl: makePlaceholder('培训协议'), mimeType: 'image/png' },
    { folderId: folders[1].id, name: '支付宝转账记录.jpg', type: 'image', size: '320KB', materialType: 'payment', dataUrl: makePlaceholder('转账记录'), mimeType: 'image/jpeg' },
    { folderId: folders[1].id, name: '招生老师聊天记录.jpg', type: 'image', size: '180KB', materialType: 'chat', dataUrl: makePlaceholder('聊天记录'), mimeType: 'image/jpeg' },
    { folderId: folders[1].id, name: '上课签到表.jpg', type: 'image', size: '95KB', materialType: 'writeoff', dataUrl: makePlaceholder('签到表'), mimeType: 'image/jpeg' },
    // 卡C 文件夹3 — 有付款截图（美团订单），缺合同
    { folderId: folders[2].id, name: '美团订单截图.jpg', type: 'image', size: '156KB', materialType: 'payment', dataUrl: makePlaceholder('美团订单'), mimeType: 'image/jpeg' },
    { folderId: folders[2].id, name: '办卡活动海报.jpg', type: 'image', size: '420KB', materialType: 'poster', dataUrl: makePlaceholder('活动海报'), mimeType: 'image/jpeg' },
    // 卡D 文件夹4 — 只有合同
    { folderId: folders[3].id, name: '摄影服务合同.pdf', type: 'pdf', size: '3.1MB', materialType: 'contract', dataUrl: makePlaceholder('摄影合同'), mimeType: 'image/png' },
    // 卡A 文件夹5（退费沟通） — 有退费沟通记录
    { folderId: folders[4].id, name: '与销售的退费沟通.jpg', type: 'image', size: '210KB', materialType: 'refund_chat', dataUrl: makePlaceholder('退费沟通'), mimeType: 'image/jpeg' },
    { folderId: folders[4].id, name: '12315投诉截图.jpg', type: 'image', size: '180KB', materialType: 'negotiation', dataUrl: makePlaceholder('投诉截图'), mimeType: 'image/jpeg' },
  ]

  files.forEach(f => {
    f.id = id('fil')
    f.uploadedAt = ts(-Math.floor(Math.random() * 30))
  })
  localStorage.setItem('qf_files', JSON.stringify(files))

  // ── 6. PIN 码（111111，方便演示锁定/解锁） ──
  localStorage.setItem('qf_pin_hash', btoa('qf_111111').slice(0, 32))
  localStorage.setItem('qf_unlocked', '1') // 初始解锁状态，演示锁定时手动清掉

  // ── 7. 清理无关数据 ──
  localStorage.removeItem('qf_draft')
  localStorage.removeItem('qf_draft_time')
  localStorage.removeItem('qf_package_images')
  sessionStorage.clear()

  // ── 完成 ──
  console.log('✅ 演示数据注入完成！')
  console.log('   4 张资产卡：健身(快到期) | 培训(正常) | 美发充卡(无限次) | 摄影(暂停)')
  console.log('   PIN 码：111111（锁定/解锁用）')
  console.log('   刷新页面即可看到效果。')
  console.log('   截图完后如需恢复：执行 localStorage.clear() + location.reload()')
})()
