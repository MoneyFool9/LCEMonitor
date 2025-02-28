// app.service.ts
import { createClient } from '@clickhouse/client'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  private client = createClient({
    url: process.env.CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USERNAME,
    password: process.env.CLICKHOUSE_PASSWORD,
    database: process.env.CLICKHOUSE_DATABASE
  })

  async createTable() {
    await this.client.exec({
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id UInt32,
          name String,
          age UInt8
        ) ENGINE = MergeTree()
        ORDER BY id
      `
    })
    return '表创建成功'
  }

  async insertData() {
    await this.client.insert({
      table: 'users',
      values: [{ id: 1, name: 'Alice', age: 25 }],
      format: 'JSONEachRow'
    })
    return '数据插入成功'
  }

  async selectData() {
    const resultSet = await this.client.query({
      query: 'SELECT * FROM users',
      format: 'JSONEachRow'
    })
    return await resultSet.json()
  }

  async updateData() {
    await this.client.exec({
      query: "ALTER TABLE users UPDATE age = 30 WHERE name = 'Alice'"
    })
    return '数据更新成功'
  }

  async deleteData() {
    await this.client.exec({
      query: 'ALTER TABLE users DELETE WHERE id = 1'
    })
    return '数据删除成功'
  }
}
