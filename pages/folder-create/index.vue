<template>
  <div class="page">
    <div class="nav-bar">
      <span class="back" @click="goBack">‹ 证据夹</span>
      <span class="title">新建证据资料夹</span>
    </div>

    <span class="label">绑定预付资产 <span class="required">*必填</span></span>
    <div class="select-wrap">
      <select v-model="assetId" class="select-box">
        <option value="" disabled>请选择绑定的预付资产</option>
        <option v-for="a in assetOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
      </select>
      <span class="arrow-down">▼</span>
    </div>

    <span class="label">文件夹名称</span>
    <input class="input-blue" v-model="folderName" placeholder="输入文件夹名称" maxlength="30" />

    <span class="label">备注说明 <span class="optional">选填</span></span>
    <textarea class="textarea-blue" v-model="folderNote" placeholder="补充说明信息（选填）"></textarea>

    <div class="btn-row">
      <div class="btn-secondary flex-1" @click="goBack">取消</div>
      <div class="btn-primary flex-1" @click="doCreate">确认创建</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { getAssets, addFolder } from '@/common/storage.js'
import { isValidFolderName } from '@/common/validator.js'
import { locked } from '@/store/lock.js'

const router = useRouter()

const assetId = ref('')
const folderName = ref('')
const folderNote = ref('')

const assetOptions = computed(() => {
  try {
    if (locked.value) return []
    const assets = getAssets()
    return assets.map(a => {
      const price = Number(a.totalPrice) || 0
      return { label: locked.value ? '信息已锁定' : `${a.storeName} · ${a.scene || ''} (¥${price.toLocaleString()})`, value: a.id }
    })
  } catch (e) { return [] }
})

function goBack() { router.back() }

const $toast = (msg) => window.__toast?.(msg)

function doCreate() {
  if (!assetId.value) { $toast('请选择绑定的预付资产'); return }
  const name = folderName.value.trim()
  if (!isValidFolderName(name)) { $toast('文件夹名称需2—30字符，不含特殊符号'); return }
  try {
    addFolder({ assetId: assetId.value, name, note: folderNote.value.trim() })
    $toast('文件夹创建成功')
    setTimeout(() => router.back(), 800)
  } catch (e) {
    $toast('创建失败：' + e.message)
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFFFFF; padding-bottom: 56px; }
.nav-bar { display: flex; align-items: center; height: 44px; background: #fff; padding: 0 16px; border-bottom: 1px solid #48A9A6; position: relative; }
.back { font-size: 15px; color: #48A9A6; cursor: pointer; z-index: 1; }
.title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: #245957; white-space: nowrap; }

.label { display: block; font-size: 15px; font-weight: bold; color: #245957; margin: 20px 16px 8px; }
.required { font-size: 12px; color: #E8686A; margin-left: 4px; }
.optional { font-size: 12px; color: #638F8D; font-weight: normal; }

.select-wrap { position: relative; margin: 0 16px; }
.select-box {
  width: 100%; height: 44px;
  background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px;
  padding: 0 36px 0 12px; font-size: 15px; color: #245957;
  appearance: none; -webkit-appearance: none; outline: none; cursor: pointer;
}
.select-box:invalid { color: #AAA; }
.arrow-down { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #48A9A6; pointer-events: none; }

.input-blue { margin: 0 16px; width: calc(100% - 32px); height: 44px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 0 12px; font-size: 15px; color: #245957; outline: none; }
.textarea-blue { margin: 0 16px; width: calc(100% - 32px); min-height: 120px; background: #B8E6E1; border: 1px solid #48A9A6; border-radius: 12px; padding: 12px; font-size: 15px; color: #245957; outline: none; resize: vertical; }

.btn-row { display: flex; gap: 12px; margin: 28px 16px; }
.flex-1 { flex: 1; }
.btn-primary { display: flex; align-items: center; justify-content: center; height: 44px; background: #48A9A6; color: #fff; border-radius: 8px; font-size: 15px; font-weight: bold; border: none; cursor: pointer; }
.btn-secondary { display: flex; align-items: center; justify-content: center; height: 44px; background: #fff; color: #48A9A6; border: 1px solid #48A9A6; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; }
</style>
