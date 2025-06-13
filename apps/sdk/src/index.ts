import { formatTimestamp, get_uuid } from '@lce-monitor/utils/src/index'
import { SDKOptions, TrackEvent } from './types'

/**
 * LCEMonitor 埋点 SDK 主类
 */
export default class LCEMonitor {
  private endpoint: string // 上报接口地址
  private queue: TrackEvent[] = [] // 待上报事件队列
  private isSending = false // 是否正在上报
  private stayStartTime = Date.now() // 页面进入时间
  private lastUrl = location.href // 上一次的 URL
  private options: SDKOptions // SDK 配置
  private uuid: string = '' // 唯一标识符，用于标识用户或会话

  /**
   * 构造函数，支持字符串或对象参数
   */
  constructor(options: SDKOptions | string) {
    if (typeof options === 'string') {
      this.options = { endpoint: options }
    } else {
      this.options = { batch: false, batchSize: 10, retryInterval: 3000, ...options }
    }
    this.endpoint = this.options.endpoint
    this.init()
  }

  /**
   * 初始化各类自动采集与监控
   */
  private init() {
    this.uuid = get_uuid() // 生成唯一标识符
    console.log('LCEMonitor initialized with UUID:', this.uuid)
    this.trackPV() // 采集 PV
    this.trackUV() // 采集 UV
    this.listenClick() // 采集点击事件
    this.listenRouteChange() // 采集路由变化
    this.trackStayTime() // 采集页面停留时长
    this.collectPerformanceData() // 采集性能数据
    this.setupErrorHandling() // 采集错误与未捕获异常
    window.addEventListener('beforeunload', () => this.flush()) // 离开页面时强制上报
  }

  /**
   * 采集页面访问 PV
   */
  private trackPV() {
    this.enqueue({
      type: 'pv',
      userId: this.uuid,
      timestamp: formatTimestamp(),
      data: { url: location.href }
    })
  }

  /**
   * 采集 UV（24小时内只采集一次）
   */
  private trackUV() {
    const uvKey = 'lce_monitor_uv'
    const now = Date.now()
    const uv = localStorage.getItem(uvKey)
    if (!uv || now - Number(uv) > 24 * 3600 * 1000) {
      // 如果没有 UV 或者超过 24 小时
      localStorage.setItem(uvKey, now.toString())
      this.enqueue({
        userId: this.uuid,
        type: 'uv',
        timestamp: formatTimestamp(),
        data: { url: location.href }
      })
    }
  }

  /**
   * 监听并采集带 data-lce-event 属性的点击事件
   */
  private listenClick() {
    document.addEventListener('click', (e) => {
      this.callWithErrorHandling(() => {
        const target = e.target as HTMLElement
        const eventName = target.getAttribute('data-lce-event')
        if (eventName) {
          this.enqueue({
            type: 'click',
            userId: this.uuid,
            timestamp: formatTimestamp(),
            data: { event: eventName, url: location.href }
          })
        }
      })
    })

    // document.addEventListener('click', (e) => {
    //   const target = e.target as HTMLElement
    //   const eventName = target.getAttribute('data-lce-event')
    //   if (eventName) {
    //     this.enqueue({
    //       type: 'click',
    //       userId: '7879',
    //       timestamp: formatTimestamp(),
    //       data: { event: eventName, url: location.href }
    //     })
    //   }
    // })
  }

  /**
   * 采集页面停留时长（离开页面时触发）
   */
  private trackStayTime() {
    window.addEventListener('beforeunload', () => {
      this.callWithErrorHandling(() => {
        const stayTime = Date.now() - this.stayStartTime
        this.enqueue({
          type: 'stay',
          userId: this.uuid,
          timestamp: formatTimestamp(),
          data: { url: location.href, stayTime }
        })
        this.flush()
      })
    })
  }

  /**
   * 监听路由变化（支持 hash/history 路由），并采集变化事件和新 PV
   */
  private listenRouteChange() {
    const handler = () => {
      if (location.href !== this.lastUrl) {
        this.enqueue({
          type: 'route',
          userId: this.uuid,
          timestamp: formatTimestamp(),
          data: { from: this.lastUrl, to: location.href }
        })
        this.lastUrl = location.href
        this.stayStartTime = Date.now()
        this.trackPV()
      }
    }
    window.addEventListener('popstate', () => this.callWithErrorHandling(handler))
    window.addEventListener('hashchange', () => this.callWithErrorHandling(handler))
    // 劫持 history.pushState/replaceState 以监听 SPA 路由变化
    const rawPush = history.pushState
    history.pushState = function (...args) {
      rawPush.apply(this, args)
      handler()
    }
    const rawReplace = history.replaceState
    history.replaceState = function (...args) {
      rawReplace.apply(this, args)
      handler()
    }
  }

  /**
   * 采集页面性能数据（如 FCP、LCP、TTFB 等）
   * 首字节时间（TTFB，Time To First Byte）
   * 首次内容绘制（FCP，First Contentful Paint）
   * 最大内容绘制（LCP，Largest Contentful Paint）
   * 可交互时间（TTI，Time To Interactive）
   * DOMContentLoaded 时间
   * 资源加载时间（如 CSS、JS、图片等的加载耗时）
   */
  private collectPerformanceData() {
    const report = () => {
      setTimeout(() => {
        this.callWithErrorHandling(() => {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          const fcp = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry
          const lcp = performance.getEntriesByName('largest-contentful-paint')[0] as PerformanceEntry
          // 计算 TTI（简单近似：DOMContentLoadedEventEnd）
          const tti = nav ? nav.domContentLoadedEventEnd : null

          // 资源加载时间统计
          const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
          const resourceStats = {
            css: 0,
            js: 0,
            img: 0,
            other: 0
          }
          let totalResourceTime = 0
          resources.forEach((res) => {
            const duration = res.duration
            totalResourceTime += duration
            if (res.initiatorType === 'css') resourceStats.css += duration
            else if (res.initiatorType === 'script') resourceStats.js += duration
            else if (res.initiatorType === 'img') resourceStats.img += duration
            else resourceStats.other += duration
          })

          const performanceData = {
            pageLoadTime: nav ? nav.loadEventEnd - nav.loadEventStart : null,
            fcp: fcp ? fcp.startTime : null,
            lcp: lcp ? lcp.startTime : null,
            ttfb: nav ? nav.responseStart - nav.requestStart : null,
            tti,
            domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
            totalResourceTime,
            resourceStats
          }
          this.enqueue({
            type: 'performance',
            userId: this.uuid,
            timestamp: formatTimestamp(),
            data: performanceData
          })
        })
      }, 0)
    }
    if (document.readyState === 'complete') {
      report()
    } else {
      window.addEventListener('load', report)
    }
  }

  /**
   * 监听并采集 JS 错误和未捕获 Promise 异常、资源加载错误、API 请求错误
   */
  private setupErrorHandling() {
    window.addEventListener(
      'error',
      (event: ErrorEvent) => {
        this.callWithErrorHandling(() => {
          // 静态资源加载错误
          if (
            event.target &&
            (event.target instanceof HTMLImageElement ||
              event.target instanceof HTMLScriptElement ||
              event.target instanceof HTMLLinkElement)
          ) {
            const target = event.target as HTMLElement
            this.enqueue({
              type: 'error',
              userId: this.uuid,
              timestamp: formatTimestamp(),
              data: {
                message: 'Resource Load Error',
                tagName: target.tagName,
                src: (target as any).src || (target as any).href || '',
                outerHTML: target.outerHTML
              }
            })
            return
          }
          // JS 运行时错误
          const { message, filename, lineno, colno, error } = event
          this.enqueue({
            type: 'error',
            userId: this.uuid,
            timestamp: formatTimestamp(),
            data: {
              message,
              filename,
              lineno,
              colno,
              stack: error?.stack || ''
            }
          })
        })
      },
      true
    ) // 捕获捕获阶段的错误

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.callWithErrorHandling(() => {
        const { reason } = event
        this.enqueue({
          type: 'unhandledrejection',
          userId: this.uuid,
          timestamp: formatTimestamp(),
          data: {
            reason: typeof reason === 'string' ? reason : reason?.message || '',
            stack: reason?.stack || ''
          }
        })
      })
    })
  }

  /**
   * 业务方自定义事件上报
   * @param event 事件名
   * @param data  事件数据
   */
  // public track(event: string, data?: Record<string, any>) {
  //   this.enqueue({
  //     type: 'custom',
  //     userId: '7879',
  //     timestamp: formatTimestamp(),
  //     data: { event, ...data }
  //   })
  // }

  /**
   * 入队并根据配置判断是否立即上报
   */
  private enqueue(event: TrackEvent) {
    this.queue.push(event)
    console.log('Event enqueued:', this.queue.length, event.type, event.data)
    this.saveCache()
    // 如果不是批量上报，或者队列已满，则立即上报
    if (!this.options.batch) {
      this.flush()
    } else if (this.queue.length >= (this.options.batchSize || 10)) {
      this.flush()
    }
  }

  /**
   * 上报数据，失败时缓存并自动重试
   */
  private async flush() {
    if (this.isSending || this.queue.length === 0) return
    this.isSending = true
    const events = this.queue.splice(0, this.queue.length)
    console.log('Flushing events:', events.length, events)
    try {
      // 推荐：批量上报
      const payload = { events }
      console.log('Sending events via fetch:', payload)
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      this.clearCache()
    } catch (err) {
      // 上报失败，重新入队并缓存，稍后重试
      console.error('Failed to send events:', err)
      this.queue.unshift(...events)
      this.saveCache()
      setTimeout(() => this.flush(), this.options.retryInterval)
    } finally {
      this.isSending = false
    }
  }

  /**
   * 将队列缓存到本地
   */
  private saveCache() {
    try {
      localStorage.setItem('lce_monitor_cache', JSON.stringify(this.queue))
    } catch {
      console.error('Failed to save cache to localStorage. Local storage may be full or disabled.')
    }
  }

  /**
   * 从本地加载缓存队列
   */
  // private loadCache() {
  //   try {
  //     const cache = localStorage.getItem('lce_monitor_cache')
  //     if (cache) {
  //       this.queue = JSON.parse(cache)
  //     }
  //   } catch {}
  // }

  /**
   * 清除本地缓存
   */
  private clearCache() {
    try {
      localStorage.removeItem('lce_monitor_cache')
    } catch {
      console.error('Failed to clear cache from localStorage. Local storage may be full or disabled.')
    }
  }

  // 用户自定义的错误处理函数
  private handleError: (e: any) => void = (e) => {
    // 默认处理：打印错误
    console.error('[LCEMonitor Error]', e)
  }

  /**
   * 用户注册自定义错误处理函数
   */
  public registerErrorHandler(fn: (e: any) => void) {
    this.handleError = fn
  }

  /**
   * 通用错误捕获执行器
   */
  private callWithErrorHandling(fn: (...args: any[]) => any, ...args: any[]) {
    try {
      return fn && fn(...args)
    } catch (e) {
      this.handleError(e)
    }
  }

  // 例：对外暴露的API都用callWithErrorHandling包裹
  public track(event: string, data?: Record<string, any>) {
    this.callWithErrorHandling(() => {
      this.enqueue({
        type: 'custom',
        userId: this.uuid,
        timestamp: formatTimestamp(),
        data: { event, ...data }
      })
    })
  }
}
