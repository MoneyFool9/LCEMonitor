/**
 * 埋点事件类型定义
 */
type EventType = 'pv' | 'uv' | 'click' | 'stay' | 'route' | 'custom' | 'performance' | 'error' | 'unhandledrejection'

/**
 * 埋点事件结构
 */
interface TrackEvent {
  event_type: EventType
  timestamp: string
  data: Record<string, any>
}

/**
 * SDK 配置项
 */
interface SDKOptions {
  endpoint: string // 上报接口地址
  batch?: boolean // 是否批量上报
  batchSize?: number // 批量上报的阈值
  retryInterval?: number // 失败重试的间隔（ms）
}

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
      event_type: 'pv',
      timestamp: new Date().toISOString(),
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
      localStorage.setItem(uvKey, now.toString())
      this.enqueue({
        event_type: 'uv',
        timestamp: new Date().toISOString(),
        data: { url: location.href }
      })
    }
  }

  /**
   * 监听并采集带 data-lce-event 属性的点击事件
   */
  private listenClick() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const eventName = target.getAttribute('data-lce-event')
      if (eventName) {
        this.enqueue({
          event_type: 'click',
          timestamp: new Date().toISOString(),
          data: { event: eventName, url: location.href }
        })
      }
    })
  }

  /**
   * 采集页面停留时长（离开页面时触发）
   */
  private trackStayTime() {
    window.addEventListener('beforeunload', () => {
      const stayTime = Date.now() - this.stayStartTime
      this.enqueue({
        event_type: 'stay',
        timestamp: new Date().toISOString(),
        data: { url: location.href, stayTime }
      })
      this.flush()
    })
  }

  /**
   * 监听路由变化（支持 hash/history 路由），并采集变化事件和新 PV
   */
  private listenRouteChange() {
    const handler = () => {
      if (location.href !== this.lastUrl) {
        this.enqueue({
          event_type: 'route',
          timestamp: new Date().toISOString(),
          data: { from: this.lastUrl, to: location.href }
        })
        this.lastUrl = location.href
        this.stayStartTime = Date.now()
        this.trackPV()
      }
    }
    window.addEventListener('popstate', handler)
    window.addEventListener('hashchange', handler)
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
   */
  private collectPerformanceData() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const fcp = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry
        const lcp = performance.getEntriesByName('largest-contentful-paint')[0] as PerformanceEntry
        const performanceData = {
          pageLoadTime: nav ? nav.loadEventEnd - nav.loadEventStart : null,
          fcp: fcp ? fcp.startTime : null,
          lcp: lcp ? lcp.startTime : null,
          ttfb: nav ? nav.responseStart - nav.requestStart : null
        }
        this.enqueue({
          event_type: 'performance',
          timestamp: new Date().toISOString(),
          data: performanceData
        })
      }, 0)
    })
  }

  /**
   * 监听并采集 JS 错误和未捕获 Promise 异常
   */
  private setupErrorHandling() {
    window.addEventListener('error', (event: ErrorEvent) => {
      const { message, filename, lineno, colno, error } = event
      this.enqueue({
        event_type: 'error',
        timestamp: new Date().toISOString(),
        data: {
          message,
          filename,
          lineno,
          colno,
          stack: error?.stack || ''
        }
      })
    })

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const { reason } = event
      this.enqueue({
        event_type: 'unhandledrejection',
        timestamp: new Date().toISOString(),
        data: {
          reason: typeof reason === 'string' ? reason : reason?.message || '',
          stack: reason?.stack || ''
        }
      })
    })
  }

  /**
   * 业务方自定义事件上报
   * @param event 事件名
   * @param data  事件数据
   */
  public track(event: string, data?: Record<string, any>) {
    this.enqueue({
      event_type: 'custom',
      timestamp: new Date().toISOString(),
      data: { event, ...data }
    })
  }

  /**
   * 入队并根据配置判断是否立即上报
   */
  private enqueue(event: TrackEvent) {
    this.queue.push(event)
    this.saveCache()
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
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
        keepalive: true
      })
      this.clearCache()
    } catch (err) {
      // 上报失败，重新入队并缓存，稍后重试
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
    } catch {}
  }

  /**
   * 从本地加载缓存队列
   */
  private loadCache() {
    try {
      const cache = localStorage.getItem('lce_monitor_cache')
      if (cache) {
        this.queue = JSON.parse(cache)
      }
    } catch {}
  }

  /**
   * 清除本地缓存
   */
  private clearCache() {
    try {
      localStorage.removeItem('lce_monitor_cache')
    } catch {}
  }
}

/**
 * 用法示例：
 * const sdk = new LCEMonitor({ endpoint: 'https://your-server.com/report', batch: true, batchSize: 5 });
 * sdk.track('login', { userId: 123 });
 */
