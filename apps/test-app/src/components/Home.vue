<!-- filepath: c:\Users\HC2\Desktop\desk\moni\LCEMonitor\apps\test-app\src\Home.vue -->
<template>
  <div>
    <header>
      <h1>LCEMonitor SDK 测试首页</h1>
      <router-link to="/about" style="margin-left: 10px">去关于页</router-link>
    </header>
    <section style="margin: 20px 0">
      <input
        v-model="inputValue"
        @input="handleInput"
        placeholder="请输入内容"
        style="padding: 6px 12px; width: 200px"
      />
      <button @click="customReport" style="margin-left: 10px">自定义上报</button>
    </section>

    <section>
      <button @click="throwError">触发 JS 错误</button>
      <button @click="rejectPromise" style="margin-left: 10px">触发 Promise 错误</button>
      <button @click="togglePanel" style="margin-left: 10px">{{ showPanel ? '隐藏' : '显示' }}面板</button>
    </section>

    <section v-if="showPanel" style="margin: 20px 0; border: 1px solid #eee; padding: 16px">
      <h3>水果列表（点击可埋点）</h3>
      <ul>
        <li v-for="item in items" :key="item" @click="selectItem(item)" style="cursor: pointer; margin: 8px 0">
          {{ item }}
        </li>
      </ul>
    </section>

    <section style="margin-top: 40px">
      <button data-lce-event="test_click">测试点击埋点</button>
    </section>
    <section style="margin-top: 40px">
      <h3>资源加载失败测试</h3>
      <img :src="notExistImg" alt="不存在的图片" width="100" />
      <!-- <script src="/not-exist-script.js"></script> -->
      <button @click="loadFailScript" style="margin-left: 10px">动态加载不存在的 JS</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import LCEMonitor from '../../../../apps/sdk/src/lo'
import { sdk } from '../sdkInstance'

const inputValue = ref('')
const showPanel = ref(false)
const items = ref(['苹果', '香蕉', '橙子'])

const notExistImg = '/not-exist-image.png'
function loadFailScript() {
  const script = document.createElement('script')
  script.src = '/not-exist-script.js'
  document.body.appendChild(script)
}
function throwError() {
  throw new Error('测试未捕获异常')
}

function rejectPromise() {
  Promise.reject('测试未捕获 Promise 错误')
}

let customReportTimer: ReturnType<typeof setTimeout> | null = null
function customReport() {
  if (customReportTimer) clearTimeout(customReportTimer)
  customReportTimer = setTimeout(() => {
    sdk.track('custom_event', { foo: 'bar', inputValue: inputValue.value })
    customReportTimer = null
  }, 500) // 500ms防抖
}

let inputDebounceTimer: ReturnType<typeof setTimeout> | null = null
function handleInput(e: Event) {
  inputValue.value = (e.target as HTMLInputElement).value
  if (inputDebounceTimer) clearTimeout(inputDebounceTimer)
  inputDebounceTimer = setTimeout(() => {
    sdk.track('input_change', { value: inputValue.value })
    inputDebounceTimer = null
  }, 500) // 500ms防抖
}

function togglePanel() {
  showPanel.value = !showPanel.value
  sdk.track('toggle_panel', { show: showPanel.value })
}

function selectItem(item: string) {
  sdk.track('select_item', { item })
}

onMounted(() => {})
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
header {
  display: flex;
  align-items: center;
  gap: 16px;
}
h1 {
  font-size: 2em;
  margin-left: 16px;
}
</style>
