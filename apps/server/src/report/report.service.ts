import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import * as mysql from 'mysql2/promise'
import { ReportDto } from './report.dto'

@Injectable()
export class ReportService {
  private readonly redis: Redis
  private db: mysql.Pool

  constructor() {
    this.redis = new Redis({ host: 'localhost', port: 6379 })
    this.db = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: process.env.MYSQL_USERNAME,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD
    })
  }

  async pushToQueue(data: ReportDto) {
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('Invalid data')
    }
    await this.redis.rpush('monitoring-data', JSON.stringify(data.events))
  }

  async showData() {
    try {
      const [rows] = await this.db.query('SELECT * FROM events')
      return rows
    } catch (error) {
      console.error('Error fetching data from MySQL:', error)
      throw new Error('Database query failed')
    }
  }
}
