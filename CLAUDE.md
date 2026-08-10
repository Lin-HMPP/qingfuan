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
├── App.vue              ← 全局样式 + PIN锁 + Toast
├── main.js              ← 路由配置 (10个路由+4 Tab)
├── index.html
├── vite.config.js       ← @别名 + SCSS变量
├── CLAUDE.md            ← 本文件
├── common/
│   ├── storage.js       ← localStorage 9类数据 CRUD (KEYS常量)
│   ├── rules-engine.js  ← 16条规则引擎+六维度评分+成本测算
│   ├── validator.js     ← 表单校验
│   └── auth.js          ← (已废弃，PIN用btoa直写)
├── store/
│   ├── lock.js          ← 全局锁状态 (locked ref, doLock, doUnlock)
│   └── login.js         ← (残留，未使用)
├── pages/               ← 10个页面
│   ├── index/           ← 首页 (到期提醒/双卡片/场景标签)
│   ├── package-input/   ← 套餐录入 (5模块表单/草稿/成本实时算)
│   ├── decision-card/   ← 决策卡 (16规则/六维度展开)
│   ├── risk-report/     ← 风险报告 (五板块/双情景成本)
│   ├── asset-list/      ← 资产列表 (卡片/核销/凭证/新增)
│   ├── asset-detail/    ← 持仓卡 (权益测算/四大按钮)
│   ├── write-off/       ← 核销录入 (日期选择/历史记录)
│   ├── evidence-folder/ ← 证据资料夹 (清单/上传/打包导出)
│   ├── folder-create/   ← 新建资料夹 (资产绑定)
│   └── mine/            ← 我的 (锁定信息/解锁/统计)
├── components/          ← 11个组件
│   ├── tab-bar/         ← 底部Tab (内联SVG 响应式变色)
│   ├── toast/           ← 深色Toast (3秒/点击关闭)
│   ├── pin-lock/        ← PIN锁 (数字键盘/设置+验证)
│   ├── scene-picker/    ← 场景选择+自定义弹窗
│   ├── image-picker/    ← 图片选择 (拍摄/相册/文件→base64)
│   ├── refund-checklist/← 退款材料清单
│   ├── pause-transfer/  ← 暂停/转卡
│   ├── asset-confirm/   ← 确认生成资产
│   ├── exit-confirm/    ← 退出确认
│   ├── write-off-detail/← 核销详情(编辑/删除)
│   └── package-loading/ ← 打包加载动画
└── static/icons/        ← 8个SVG Tab图标
```

## 路由 & TabBar
| 路径 | 页面 | Tab |
|------|------|-----|
| `/home` | 首页 | ✅ |
| `/package-input` | 套餐录入 | ❌ |
| `/decision-card` | 决策卡 | ❌ |
| `/risk-report` | 风险报告 | ❌ |
| `/asset-list` | 资产列表 | ✅ |
| `/asset-detail` | 持仓卡 | ❌ |
| `/write-off` | 核销录入 | ❌ |
| `/evidence-folder` | 证据资料夹 | ✅ |
| `/folder-create` | 新建资料夹 | ❌ |
| `/mine` | 我的 | ✅ |

## 关键数据流
1. **套餐录入→决策卡**：`sessionStorage.setItem('qf_package_data', JSON.stringify(data))` → 决策卡 `onMounted` 读取
2. **决策卡→返回套餐录入**：`sessionStorage.setItem('qf_draft_back', ...)` → 套餐录入自动回填
3. **确认生成资产**：`addAsset()` → localStorage + `addFolder()` 自动创建同名资料夹
4. **页面间导航**：统一用 `router.push('/path')` 或 `router.push(\`/path?id=\${id}\`)`（注意是反引号！）
5. **global Toast**：`window.__toast?.('消息')` （遇到 `?.` 报错改为 `window.__toast('消息')`）

## PIN 锁机制（重要！）
- **共享状态**：`store/lock.js` → `locked` ref → App.vue + 所有页面 import 使用
- **hash 算法**：`btoa('qf_' + pin).slice(0, 32)` ——直接用这个，别用 auth.js 的 crypto.subtle
- **锁定状态存储**：`qf_pin_hash`（PIN哈希） + `qf_unlocked`（值为'1'时解锁）
- **锁定→解锁流程**：点「锁定信息」→ 每次强制重设PIN → 锁定 → 信息隐藏(•••) → 点「解锁」→ 验证PIN
- **全应用隐藏**：各页面 `import { locked } from '@/store/lock.js'` → `v-if="!locked"` 或 `{{ locked ? '•••' : realValue }}`

## 重要约定
1. **✅ 只做视觉美化**：不改文案、交互、数据、路由（记忆文件有记录）
2. **反引号导航**：`router.push(\`/path?id=\${id}\`)` 必须用反引号，不能用单引号
3. **localStorage KEY**：`qf_account` / `qf_assets` / `qf_writeoffs` / `qf_pauses` / `qf_folders` / `qf_files` / `qf_draft` / `qf_logs`
4. **$toast 声明**：每个页面自己声明 `const $toast = (msg) => window.__toast?.(msg)`
5. **HTML 标签**：全用标准HTML（`<div> <span> <input> <textarea>`），不用 uni-app 的 `<view> <text>`
6. **禁止 `inject('$toast')`**：全改用 `window.__toast`
7. **禁止 `uni.*` API**：全项目无 uni-app

## 已知问题 / 注意点
- `image-picker` 用 `document.createElement('input')` 动态创建文件选择器
- `scene-picker` 的「+ 自定义」emit `'custom'` 事件 → 父组件监听 `@custom`
- 证据资料夹的「一键打包」生成 HTML 文件 → `Blob` + `URL.createObjectURL` → `<a>.click()` 下载
- 服务器绑定 `0.0.0.0` 才可手机访问：`npx vite --host 0.0.0.0`

## 当前进度
- ✅ 10个页面 + 11个组件 + 路由 + TabBar
- ✅ 16条规则引擎 + 六维度评分
- ✅ 套餐录入完整流程（表单→决策→确认→资产）
- ✅ 证据资料夹上传/管理/打包
- ✅ PIN码锁定/解锁全应用
- ✅ 全局薄荷绿配色
- ⚠️ 部分页面数据需手动刷新（Tab切换时 localStorage 读取）
