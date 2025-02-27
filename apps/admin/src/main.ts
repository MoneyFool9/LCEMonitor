// eslint-disable perfectionist/sort-imports

// core
import App from '@/App.vue'
import { pinia } from '@/pinia'
import { installPlugins } from '@/plugins'
import { router } from '@/router'
// css
import '@@/assets/styles/index.scss'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'normalize.css'
import 'nprogress/nprogress.css'
import 'virtual:uno.css'
import 'vxe-table/lib/style.css'

// 创建应用实例
const app = createApp(App)

// 安装插件（全局组件、自定义指令等）
installPlugins(app)

// 安装 pinia 和 router
app.use(pinia).use(router)

// router 准备就绪后挂载应用
router.isReady().then(() => {
  app.mount('#app')
})
