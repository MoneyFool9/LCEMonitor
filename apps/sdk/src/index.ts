export default class LCEMonitor {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
    this.init()
  }

  private init() {
    this.collectPerformanceData()
    this.setupErrorHandling()
  }

  private collectPerformanceData() {
    const performanceNavigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    window.addEventListener('load', () => {
      const performanceData = {
        event_type: 'performance',
        timestapm: new Date().toISOString(),
        data: {
          pageLoadTime: performanceNavigationTiming.loadEventEnd - performanceNavigationTiming.loadEventStart,
          fcp: performance.getEntriesByName('first-contentful-paint')[0].startTime || null,
          lcp: performance.getEntriesByName('largest-contentful-paint')[0].startTime || null,
          tti: performanceNavigationTiming.domInteractive - performanceNavigationTiming.loadEventStart
        }
      }
      this.sendData(performanceData)
    })
  }

  private setupErrorHandling() {
    window.addEventListener('error', (event: ErrorEvent) => {
      const { message, filename, lineno, colno, error } = event
      const errorData = {
        event_type: 'error',
        timestamp: new Date().toISOString(),
        data: {
          message,
          filename,
          lineno,
          colno,
          stock: error?.stack || ''
        }
      }
      this.sendData(errorData)
    })

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
    navigator.sendBeacon(this.endpoint, JSON.stringify(data))
  }
}
