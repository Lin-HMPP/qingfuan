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
3. **localStorage KEY**：`qf_account` / `qf_assets` / `qf_writeoffs` / `qf_pauses` / `qf_folders` / `qf_files` / `qf_draft` / `qf_logs`
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

## 最近完成的优化（2026-08-10）
### 全新功能
- 快速录入页 `/quick-input`：5字段极简建卡，10秒完成
- 首页右上角 ➕ 快速录入入口（弹窗确认）
- 决策卡全新重设计：结论横幅 + 花费算账 + 问题列表 + 行动清单 + 内嵌风险详情
- 场景化文案：切换场景自动切换填写提示和规则选项
- 暂停锁卡实用化 + 编辑套餐时间（原"转卡"改为"改期"）
- 套餐录入模块二~四默认折叠，显示完成状态标识

### 视觉美化
- 全站 emoji 替换为 SVG 线条图标
- `common/icons.js`：30+ SVG 图标定义库
- 资产创建时自动同步上传资料到证据夹
- 非图片文件 base64 读取 + 导出 HTML 下载链接

### 机制加固
- 锁横幅：运行时锁定状态下任何页面底部显示解锁入口
- `updateFolder` / `deleteFolder` 级联删除
- 核销页暂停/过期拦截
- 资料夹编辑名称 + 删除功能
- 资料夹卡片显示文件夹名称（"无名资料夹"兜底）
