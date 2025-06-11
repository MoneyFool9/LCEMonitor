/**
 * 埋点事件类型定义
 */
export type EventType =
  | 'pv'
  | 'uv'
  | 'click'
  | 'stay'
  | 'route'
  | 'custom'
  | 'performance'
  | 'error'
  | 'unhandledrejection'

/**
 * 埋点事件结构
 */
export interface TrackEvent {
  type: EventType
  timestamp: string
  userId: string
  data: Record<string, any>
}

/**
 * SDK 配置项
 */
export interface SDKOptions {
  endpoint: string
  batch?: boolean
  batchSize?: number
  retryInterval?: number
}
