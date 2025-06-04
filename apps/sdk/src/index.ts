export default class LCEMonitor {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint // 传入监控数据的发送地址
    this.init()
  }

  private init() {
    this.collectPerformanceData() // 收集性能数据
    // 初始化错误处理
    this.setupErrorHandling()
  }

  private collectPerformanceData() {
    // 检查浏览器是否支持 Performance API
    const performanceNavigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    window.addEventListener('load', () => {
      // 收集页面加载性能数据
      const performanceData = {
        event_type: 'performance', // 事件类型, 可以根据需要修改
        timestapm: new Date().toISOString(), // 时间戳
        // 收集的性能数据
        // 注意: 这里的性能数据可能会因浏览器而异
        data: {
          // 页面加载时间
          pageLoadTime: performanceNavigationTiming.loadEventEnd - performanceNavigationTiming.loadEventStart,
          // 资源加载时间
          fcp: performance.getEntriesByName('first-contentful-paint')[0].startTime || null,
          // 首屏时间
          lcp: performance.getEntriesByName('largest-contentful-paint')[0].startTime || null,
          // TTI (Time to Interactive), 页面可交互时间
          tti: performanceNavigationTiming.domInteractive - performanceNavigationTiming.loadEventStart
        }
      }
      // 发送性能数据
      this.sendData(performanceData)
    })
  }

  private setupErrorHandling() {
    // 监听全局错误事件和未处理的 Promise 拒绝事件
    window.addEventListener('error', (event: ErrorEvent) => {
      // 处理错误事件, 提取错误信息
      // 注意: event 对象的属性可能因浏览器而异
      const { message, filename, lineno, colno, error } = event
      const errorData = {
        event_type: 'error',
        timestamp: new Date().toISOString(),
        data: {
          message,
          filename,
          lineno, // 行号
          colno, // 列号
          stock: error?.stack || '' // 错误堆栈信息
        }
      }
      this.sendData(errorData)
    })
    // 监听未处理的 Promise 拒绝事件
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const { reason, promise } = event
      const errorData = {
        event_type: 'unhandledrejection',
        timestamp: new Date().toISOString(),
        data: {
          reason,
          promise,
          stock: reason?.stack || ''
        }
      }
      this.sendData(errorData)
    })
  }

  private sendData(data: any) {
    // 使用 navigator.sendBeacon 发送数据
    navigator.sendBeacon(this.endpoint, JSON.stringify(data))
  }
}
