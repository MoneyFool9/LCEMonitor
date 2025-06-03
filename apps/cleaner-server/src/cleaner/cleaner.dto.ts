export interface EventData {
  type: string
  userId: string
  data: any
  timestamp?: string
}

export interface CleanedEvent {
  timestamp: string
  type: string
  userId: string
  data: string
}
