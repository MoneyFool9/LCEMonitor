export interface EventData {
  type: string
  userId: string
  data: any
  timestamp: string
}

export class ReportDto {
  events: EventData[]
}
