import { Injectable, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'
import * as mysql from 'mysql2/promise'
import { CleanedEvent, EventData } from './cleaner.dto'

@Injectable()
export class CleanerService implements OnModuleInit {
  private redis: Redis
  private db: mysql.Pool

  constructor() {}

  async onModuleInit() {
    this.redis = new Redis({ host: 'localhost', port: 6379 })
    this.db = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: process.env.MYSQL_USERNAME,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD
    })

    try {
      await this.redis.ping()
      console.log('Redis connected successfully')
    } catch (error) {
      console.error('Redis connection error:', error)
    }
    const [rows] = await this.db.query('SELECT 1')
    console.log('MySQL connected:', rows)

    await this.consumeQueue()
  }

  private async consumeQueue() {
    while (true) {
      try {
        // @ts-expect-error: ioredis types are not fully compatible with the latest version
        // 阻塞式地从 Redis 队列中获取数据，模块加载时会自动开始消费队列
        const [_, rawData] = await this.redis.blpop('monitoring-data', 0)
        const events: EventData[] = JSON.parse(rawData)

        // 清洗数据
        const cleanedData = this.cleanData(events)

        // 如果清洗后的数据不为空，则插入到 MySQL 数据库
        if (cleanedData.length > 0) {
          await this.db.query('INSERT INTO events (timestamp, type, user_id, data) VALUES ?', [
            cleanedData.map((d) => [d.timestamp, d.type, d.userId, d.data])
          ])
          console.log(`Inserted ${cleanedData.length} cleaned events into MySQL`)
        }
      } catch (error) {
        console.error('Error processing queue:', error)
        // 如果发生错误，等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
  }

  // 清洗数据方法, 去除重复和无效数据
  private cleanData(events: EventData[]): CleanedEvent[] {
    // 使用 Set 来跟踪已处理的事件，避免重复
    const seen = new Set<string>()
    // 定义清洗后的事件数组
    const cleaned: CleanedEvent[] = []

    // 遍历所有事件，清洗数据
    for (const event of events) {
      // 检查事件是否包含必要的字段
      if (!event.type || !event.userId) continue

      // 检查事件的唯一性，使用 userId、timestamp 和 type 组合成唯一键
      const eventKey = `${event.userId}-${event.timestamp}-${event.type}`
      // 如果该事件已经处理过，则跳过
      if (seen.has(eventKey)) continue
      // 将该事件标记为已处理
      seen.add(eventKey)

      // 将清洗后的事件添加到结果数组中
      // 使用当前时间戳作为默认值，如果事件没有提供时间戳
      cleaned.push({
        timestamp: event.timestamp || new Date().toISOString(),
        type: event.type,
        userId: event.userId,
        data: JSON.stringify(event.data || {})
      })
    }
    // 返回清洗后的事件数组
    return cleaned
  }
}
