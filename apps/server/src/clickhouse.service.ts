import { ClickHouseClient, createClient } from '@clickhouse/client'
import { Injectable } from '@nestjs/common'
import { QueryOption } from './type'

@Injectable()
export class ClickhouseService {
  private client: ClickHouseClient // ClickHouse 客户端实例
  // 使用 createClient 创建 ClickHouse 客户端
  // 通过环境变量配置连接信息

  constructor() {
    this.client = createClient({
      url: process.env.CLICKHOUSE_URL,
      username: process.env.CLICKHOUSE_USERNAME,
      password: process.env.CLICKHOUSE_PASSWORD,
      database: process.env.CLICKHOUSE_DATABASE
    })
  }

  async insertData(data: any) {
    try {
      // 执行插入操作
      await this.client.insert({
        table: 'monitor_log', // 目标表名
        values: [data], // 将单条数据放入数组
        format: 'JSONEachRow' // 数据格式为 JSONEachRow
      })
    } catch (error) {
      console.error('插入数据失败:', error.message)
      throw error
    } finally {
      await this.client.close() // 关闭连接
    }
  }

  async selectData(options: QueryOption = {}) {
    try {
      // 构建查询语句
      let query = 'SELECT * FROM monitor_log'
      const conditions = []

      // 添加条件
      if (options.level) {
        conditions.push(`level = '${options.level}'`)
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }

      query += ' ORDER BY timestamp DESC'
      if (options.limit) {
        query += ` LIMIT ${options.limit}`
      }

      // 执行查询
      const resultSet = await this.client.query({
        query: query,
        format: 'JSONEachRow' // 返回每行数据的 JSON 格式
      })

      // 获取结果
      const rows = await resultSet.json()
      console.log(`查询到 ${rows.length} 条数据`)
      return rows
    } catch (error) {
      console.error('查询失败:', error.message)
      throw error
    } finally {
      await this.client.close() // 关闭连接
    }
  }
}
