import { Injectable, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'
import mysql from 'mysql2/promise'
import { CleanedEvent, EventData } from './cleaner.dto'

@Injectable()
export class CleanerService implements OnModuleInit {
  private readonly redis: Redis
  private readonly db: mysql.Pool

  constructor() {
    this.redis = new Redis({ host: 'redis', port: 6379 })
    this.db = mysql.createPool({
      host: 'mysql',
      user: 'root',
      database: 'monitoring',
      password: 'root'
    })
  }

  async onModuleInit() {
    await this.consumeQueue()
  }

  private async consumeQueue() {
    while (true) {
      try {
        // 阻塞读取 Redis List
        // @ts-expect-error: Type 'number' is not assignable to type 'string'
        const [_, rawData] = await this.redis.blpop('monitoring-data', 0)
        const events: EventData[] = JSON.parse(rawData)

        // 数据清洗
        const cleanedData = this.cleanData(events)

        // 批量插入 MySQL
        if (cleanedData.length > 0) {
          await this.db.query('INSERT INTO events (timestamp, type, user_id, data) VALUES ?', [
            cleanedData.map((d) => [d.timestamp, d.type, d.userId, d.data])
          ])
        }
      } catch (error) {
        console.error('Error processing queue:', error)
      }
    }
  }

  private cleanData(events: EventData[]): CleanedEvent[] {
    const seen = new Set<string>() // 用于去重
    const cleaned: CleanedEvent[] = []

    for (const event of events) {
      // 验证事件
      if (!event.type || !event.userId) {
        continue // 跳过无效事件
      }

      // 去重（基于 userId + timestamp + type）
      const eventKey = `${event.userId}-${event.timestamp}-${event.type}`
      if (seen.has(eventKey)) {
        continue
      }
      seen.add(eventKey)

      // 格式化
      cleaned.push({
        timestamp: event.timestamp || new Date().toISOString(),
        type: event.type,
        userId: event.userId,
        data: JSON.stringify(event.data || {})
      })
    }

    return cleaned
  }
}
