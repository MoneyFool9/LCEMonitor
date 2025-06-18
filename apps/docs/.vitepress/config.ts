import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: 'LCE埋点监控平台',
  description: '提供前端埋点、后端埋点、数据分析等功能。快点来体验吧！',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/api-examples' },
      { text: 'SDK用例', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'SDK用例',
        items: [
          { text: 'SDK用例', link: '/markdown-examples' },
          { text: 'API文档', link: '/api-examples' }
        ]
      }
    ],
    // 设置搜索框的样式
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/MoneyFool9/LCEMonitor' }]
  }
})
