# 青付安 (QingFuAn) — Claude 开发交接文档

## 项目一句话
青年预付消费管理 PWA，帮助用户在办卡前测算风险、办卡后管理资产和凭证。

## 技术栈
- **Vue 3** (Composition API / `<script setup>`)
- **Vue Router 4** (Hash 模式)
- **Pinia** (仅 lock store 在用)
- **Vite 5** (端口 3000)
- **localStorage** (全部数据，无后端)
- **SCSS** (全局变量在 `vite.config.js`)

## 启动命令
```bash
cd C:\Users\HUAWEI\Desktop\qingfuan
npm install
npm run dev
# → http://localhost:3000
```

## 公开链接
- 仓库：`https://github.com/Lin-HMPP/qingfuan`
- 公开页面：`https://lin-hmpp.github.io/qingfuan/`
- 部署方式：推送 `main` 分支 → GitHub Actions 自动构建部署到 `gh-pages` 分支

## 配色方案（已定稿，勿改）
| 用途 | 色值 | 
|------|------|
| 主色（薄荷绿） | `#48A9A6` |
| 浅底色 | `#B8E6E1` |
| 按压加深 | `#9FD8D2` |
| 正文 | `#245957` |
| 辅助文字 | `#4A7A77` / `#638F8D` |
| 危险色 | `#E8686A` |
| 页面背景 | `#F5FAFA` |
| 卡片边框 | `1.5px solid #48A9A6` |

## 文件结构（核心文件）
```
qingfuan/
├── App.vue              ← 全局样式 + PIN锁 + Toast + 锁横幅
├── main.js              ← 路由配置 (11个路由：+quick-input)
├── index.html
├── vite.config.js       ← @别名 + SCSS变量
├── CLAUDE.md            ← 本文件
├── common/
│   ├── storage.js       ← localStorage 9类数据 CRUD (KEYS常量) + updateFolder + MATERIAL_LABEL_MAP
│   ├── rules-engine.js  ← 16条规则引擎+六维度评分+成本测算(含无限次模式)
│   ├── validator.js     ← 表单校验
│   ├── analytics.js     ← 百度统计+Clarity埋点
│   ├── icons.js         ← 30+ SVG线条图标库（公共组件用）
│   └── auth.js          ← (已废弃，PIN用btoa直写)
├── store/
│   ├── lock.js          ← 全局锁状态 (locked/showLockBanner ref, checkLock, doLock, doUnlock)
│   └── login.js         ← (残留，未使用)
├── pages/               ← 11个页面
│   ├── index/           ← 首页 (双卡片入口/到期提醒/场景标签/右上角+快速录入弹窗)
│   ├── quick-input/     ← 快速录入 (5字段极简建卡/10秒完成/直接跳转资产列表)
│   ├── package-input/   ← 套餐录入 (5模块表单/场景化文案/草稿/成本实时算)
│   ├── decision-card/   ← 决策卡 (结论横幅+花费算账+问题列表+行动清单+内嵌风险详情)
│   ├── risk-report/     ← 风险报告 (五板块/普通双情景成本+无限次充卡价值分析)
│   ├── asset-list/      ← 资产列表 (卡片/核销/凭证/新增/管理/编辑/删除)
│   ├── asset-detail/    ← 持仓卡 (权益测算/SVG图标按钮/暂停恢复/无限次展示)
│   ├── write-off/       ← 核销录入 (日期选择/历史记录/无限次打卡模式/暂停过期拦截)
│   ├── evidence-folder/ ← 证据资料夹 (清单/上传/打包导出/编辑删除文件夹/名称展示)
│   ├── folder-create/   ← 新建资料夹 (资产绑定)
│   └── mine/            ← 我的 (锁定信息/解锁/统计)
├── components/          ← 11个组件
│   ├── tab-bar/         ← 底部Tab (内联SVG 响应式变色)
│   ├── toast/           ← 深色Toast (3秒/点击关闭)
│   ├── pin-lock/        ← PIN锁 (数字键盘/设置+验证)
│   ├── scene-picker/    ← 场景选择+自定义弹窗
│   ├── image-picker/    ← 图片选择 (拍摄/相册/文件→base64)
│   ├── refund-checklist/← 退款材料清单 (支持无限次时间比例模式)
│   ├── pause-transfer/  ← 暂停锁卡+编辑套餐时间 (重构版)
│   ├── asset-confirm/   ← 确认生成资产
│   ├── exit-confirm/    ← 退出确认
│   ├── write-off-detail/← 核销详情(编辑/删除)
│   └── package-loading/ ← 打包加载动画
└── static/icons/        ← 8个SVG Tab图标
```

## 路由 & TabBar (11个路由)
| 路径 | 页面 | Tab |
|------|------|-----|
| `/home` | 首页 | ✅ |
| `/quick-input` | 快速录入(新增) | ❌ |
| `/package-input` | 套餐录入 | ❌ |
| `/decision-card` | 决策卡 | ❌ |
| `/risk-report` | 风险报告(可跳过) | ❌ |
| `/asset-list` | 资产列表 | ✅ |
| `/asset-detail` | 持仓卡 | ❌ |
| `/write-off` | 核销录入 | ❌ |
| `/evidence-folder` | 证据资料夹 | ✅ |
| `/folder-create` | 新建资料夹 | ❌ |
| `/mine` | 我的 | ✅ |

## 关键数据流
1. **快速录入**：首页右上角+ → 确认弹窗 → `/quick-input` → 5字段 → `addAsset()` + `addFolder()` → `router.push('/asset-list')`
2. **套餐录入→决策卡**：`sessionStorage.setItem('qf_package_data', JSON.stringify(data))` → 决策卡 `onMounted` 读取
3. **决策卡→返回套餐录入**：`sessionStorage.setItem('qf_draft_back', ...)` → 套餐录入自动回填
4. **确认生成资产**：`addAsset()` → localStorage + `addFolder()` 自动创建同名资料夹 + `addFile()` 保存上传的图片
5. **页面间导航**：统一用 `router.push('/path')` 或 `router.push(\`/path?id=\${id}\`)` —— **严禁 `router.back()`**（会触发浏览器退出弹窗）
6. **global Toast**：`window.__toast('消息')` 有 DOM 兜底确保任何情况下可见

## 无限次模式（充卡/不限次数）
- 资产字段 `unlimited: true` 时启用
- 核销页自动切换为「到店打卡」模式：隐藏次数输入，每次自动计1次
- 持仓卡展示「累计到店 X 次」「日均成本」「单次到店成本」「时间进度条」
- 资产列表显示「已到店 X 次 · 充卡不限次数」
- 风险报告用「充卡价值分析」替换深度成本测算
- 退款清单用时间比例计算替代次数计算

## PIN 锁机制（已加固）
- **共享状态**：`store/lock.js` → `locked` ref + `showLockBanner` ref
- **hash 算法**：`btoa('qf_' + pin).slice(0, 32)`
- **锁定状态存储**：`qf_pin_hash`（PIN哈希） + `qf_unlocked`（值为'1'时解锁）
- **三重防护**：
  1. 启动时检测锁状态 → 弹出 PIN 解锁界面
  2. 运行时锁定 → 页面底部显示 `🔒 信息已锁定 · 点击解锁` 深色胶囊横幅
  3. 点横幅直接弹出 PIN 验证，无需导航到「我的」
- **lock store 导出**：`locked`, `showLockBanner`, `checkLock()`, `doLock()`, `doUnlock()`
- **App.vue**：`onMounted` 调用 `checkLock()`，返回 true 则显示 PIN 锁屏；`showLockBanner` 控制运行时横幅

## 重要约定
1. **禁止 `router.back()`**：全部替换为 `router.push('/确定路径')`
2. **反引号导航**：`router.push(\`/path?id=\${id}\`)` 必须用反引号
3. **localStorage KEY**：`qf_account` / `qf_assets` / `qf_writeoffs` / `qf_pauses` / `qf_folders` / `qf_files` / `qf_draft` / `qf_logs` / `qf_package_images`（图片临时存储）
4. **HTML 标签**：全用标准HTML，不用 uni-app 的 `<view> <text>`
5. **禁止 `inject('$toast')`**：全改用 `window.__toast`
6. **禁止 `uni.*` API**
7. **全线SVG图标**：不用 emoji 表情符号，统一用 24×24 viewBox 线条 SVG，颜色通过 CSS 继承
8. **不要引入黄色 `#FFD133`**
9. **场景化文案**：`SCENE_COPY` 对象在 `package-input/index.vue` 中，含4个固定场景+默认场景的 placeholder 和规则选项
10. **storage.js 新增函数**：`updateFolder(id, patch)`、`deleteFolder(id)` 级联删除文件

## 场景化文案（SCENE_COPY in package-input）
4个固定场景 + 默认场景，每个包含：
- 各字段 placeholder（总价/次数/期限/预算/频率/店名/合同/收款/促销）
- 规则选项列表（退款/转卡/暂停，不同场景用不同术语如"休学""延期""转让"）

## 最新状态（2026-08-11）

### 已部署功能
- **使用频率周/月/年切换**：模块二频率支持切换时间单位，内部归一化为每周次数，向下兼容旧数据（新增 `freqValue` + `freqUnit` 字段，旧字段 `weeklyFreq` 已弃用但保留兼容）
- **图片编辑器**：`components/image-editor/`，上传图片后可点 ✎ 进入打码/裁剪，canvas 处理
- **导出预览弹窗**：证据夹导出前弹窗预览所有材料，图片可点击放大，确认后下载
- **新用户引导**：首页检测无资产时自动弹使用指南（4 步：录卡→评估→管理→留证），`qf_onboarded` 标记
- **PWA 桌面图标**：manifest.webmanifest + icon-192/512.png + apple-touch-icon，支持各浏览器添加
- **离线版 ZIP**：`npm run build:offline` 用 vite-plugin-singlefile 内联为单个 HTML，通过 GitHub Releases 分发
- **决策卡固定消费建议**：行动清单首条固定显示"高频且稳定→年卡…量力消费"，`fixedTip` + `fixed-tip` 样式区分
- **添加到桌面按钮**：「我的」页面智能识别微信/浏览器，安卓 Chrome 支持一键安装
- **风险评估会默认展开一个维度**：决策卡默认展开第一个维度

### 体验优化（2026-08-11 批量修复）
- ⊕ 图标 tooltip："快速录入：10秒极简建卡"
- 到期提醒为空时显示"录入第一张卡"引导链接
- 快速录入新增 1 个月期限选项；成功后跳转持仓卡而非资产列表
- 资产列表按到期日从近到远排序；空态加"快速录入"按钮
- 套餐录入模块折叠态提示改为"展开填写 ›"（含 module2Status 修复：旧字段 `weeklyFreq`→`freqValue`）
- 持仓卡"课时履约"→场景化标签（`usageLabel`）
- 核销次数默认 1，Toast 显示剩余次数/累计到店次数
- 决策卡 sessionStorage 同步备份到 localStorage（`qf_decision_backup`），刷新不丢失
- 风险报告维度建议展示所有命中规则（非仅第一条）
- 证据夹空文件夹导出前拦截提示
- 重置数据双重 confirm

### 稳定性修复
- **移除 Service Worker**（微信打不开、桌面端 404、夸克按钮无响应）：`main.js` 自毁旧 SW 不注册新的
- **构建目标 ES2015**（兼容夸克/UC/荣耀等国产浏览器旧内核）
- **PWA 独立模式视图修复**：`100vh`→`100dvh`，`safe-top` 适配状态栏，`lock-banner` bottom 适配安全区
- 首页"查看全部"字体 22px→12px
- 套餐录入收款账户 `readonly` 改用 computed 返回 boolean（修复直接付商家时无法输入）
- 证据夹布局：TabBar 遮挡修复、文件夹选中高亮、选中后隐藏列表
- MATERIAL_LABEL_MAP 导入补全（套餐录入 + 决策卡），修复上传图片后提交无反应
- 旧版 onEditDone 重复代码清理导致的构建失败
- 安装指引 CSS `.step-num` 冲突修复 → `.guide-num`

### 当前关键约定
- `router.back()` 全局禁用，统一 `router.push()`
- `form.value.freqValue` + `freqUnit` 是新字段，`weeklyFreq` 已弃用（但 onSubmit 会归一化写入）
- `qf_decision_backup` 是决策卡刷新容灾备份
- `qf_onboarded` 标记新用户引导已完成
- 离线版用 `vite.offline.config.js` 构建，不要改主 `vite.config.js`
- 图片编辑器在 `components/image-editor/`，通过 `editingImage` ref 触发显示
- GitHub Pages 部署用 `peaceiris/actions-gh-pages@v4` + `force_orphan: true`
