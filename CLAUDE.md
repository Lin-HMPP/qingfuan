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
├── App.vue              ← 全局样式 + PIN锁 + Toast
├── main.js              ← 路由配置 (10个路由+4 Tab)
├── index.html
├── vite.config.js       ← @别名 + SCSS变量
├── CLAUDE.md            ← 本文件
├── common/
│   ├── storage.js       ← localStorage 9类数据 CRUD (KEYS常量)
│   ├── rules-engine.js  ← 16条规则引擎+六维度评分+成本测算
│   ├── validator.js     ← 表单校验
│   ├── analytics.js     ← 百度统计+Clarity埋点
│   └── auth.js          ← (已废弃，PIN用btoa直写)
├── store/
│   ├── lock.js          ← 全局锁状态 (locked ref, checkLock, doLock, doUnlock)
│   └── login.js         ← (残留，未使用)
├── pages/               ← 10个页面
│   ├── index/           ← 首页 (到期提醒/双卡片/场景标签)
│   ├── package-input/   ← 套餐录入 (5模块表单/草稿/成本实时算)
│   ├── decision-card/   ← 决策卡 (16规则/六维度展开)
│   ├── risk-report/     ← 风险报告 (五板块/双情景成本)
│   ├── asset-list/      ← 资产列表 (卡片/核销/凭证/新增/管理/编辑/删除)
│   ├── asset-detail/    ← 持仓卡 (权益测算/四大按钮/无限次展示)
│   ├── write-off/       ← 核销录入 (日期选择/历史记录/无限次打卡模式)
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
3. **确认生成资产**：`addAsset()` → localStorage + `addFolder()` 自动创建同名资料夹 + `addFile()` 保存上传的图片
4. **页面间导航**：统一用 `router.push('/path')` 或 `router.push(\`/path?id=\${id}\`)` —— **严禁 `router.back()`**（会触发浏览器退出弹窗）
5. **global Toast**：`window.__toast('消息')`

## 无限次模式（充卡/不限次数）
- 资产字段 `unlimited: true` 时启用
- 核销页自动切换为「到店打卡」模式：隐藏次数输入，每次自动计1次
- 持仓卡展示「累计到店 X 次」「日均成本」「单次到店成本」「时间进度条」
- 资产列表显示「已到店 X 次 · 充卡不限次数」

## PIN 锁机制（重要！）
- **共享状态**：`store/lock.js` → `locked` ref → App.vue + 所有页面 import 使用
- **hash 算法**：`btoa('qf_' + pin).slice(0, 32)`
- **锁定状态存储**：`qf_pin_hash`（PIN哈希） + `qf_unlocked`（值为'1'时解锁）
- **锁定→解锁流程**：点「锁定信息」→ 强制重设PIN → 锁定 → 信息隐藏(•••) → 点「解锁」→ 验证PIN
- **全应用隐藏**：各页面 `import { locked } from '@/store/lock.js'` → `v-if="!locked"` 或 `{{ locked ? '•••' : realValue }}`
- **⚠️ 已知问题**：「锁定信息」后 app 保持锁定状态，所有按钮被 `guard()` 拦截。用户需到「我的」→「解锁」才能恢复。如果用户不知道这一点会以为按钮坏了

## 重要约定
1. **禁止 `router.back()`**：全部替换为 `router.push('/确定路径')`，防止历史栈耗尽导致浏览器弹窗
2. **反引号导航**：`router.push(\`/path?id=\${id}\`)` 必须用反引号
3. **localStorage KEY**：`qf_account` / `qf_assets` / `qf_writeoffs` / `qf_pauses` / `qf_folders` / `qf_files` / `qf_draft` / `qf_logs`
4. **HTML 标签**：全用标准HTML，不用 uni-app 的 `<view> <text>`
5. **禁止 `inject('$toast')`**：全改用 `window.__toast`
6. **禁止 `uni.*` API**
7. **不要引入黄色 `#FFD133`**：之前试过，效果不好，已全部回退。保持纯薄荷绿配色

## 最近完成的修复（2026-08-10）
### Bug修复（30+项）
- PIN重置绕过漏洞、锁定即销毁PIN、资产字段丢失(unlimited/noExpiry)
- 删除资产不同步清理核销/资料夹/暂停记录
- 核销编辑 usedTimes 无上限约束
- asset-confirm 空数据崩溃、package-loading toast乱码
- 管理模式锁绕过、隐私泄露、XSS注入(HTML报告转义)
- DOM泄漏(文件选择器残留)、事件监听泄漏
- 除零保护(rules-engine)、无限次模式误判(ruleR2)
- Blob URL过早回收、toast定时器残留

### 功能新增
- 无限次模式「到店打卡」核销方案
- 创建资产时自动创建证据资料夹 + 保存上传图片

### 视觉相关
- 尝试过黄色主题色 → 效果不好 → 已全部回退到纯薄荷绿
- 尝试过卡片角装饰线 → 冗余 → 已全部移除

## 当前待处理
- **按钮失灵问题**：如果用户测试过PIN锁功能，localStorage残留`qf_pin_hash`但无`qf_unlocked`会导致app锁定。临时解决：Console运行 `localStorage.removeItem('qf_pin_hash'); localStorage.removeItem('qf_unlocked'); location.reload()`
- 百度统计脚本的 `unload` permissions policy 警告（无害，可忽略）
