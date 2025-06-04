// app.service.ts
import { Injectable } from '@nestjs/common'
import { Kafka, Producer } from 'kafkajs'

@Injectable()
export class AppService {
  private kafkaProducer: Producer
  constructor() {
    const kafka = new Kafka({
      clientId: 'monitoring-service', // 客户端ID
      // 这里需要设置Kafka集群的地址
      // 可以通过环境变量来配置，方便在不同环境下使用
      brokers: [process.env.KAFKA_BROKER] // Kafka集群地址
    })

    this.kafkaProducer = kafka.producer() // kafka生产者
    this.kafkaProducer.connect() // 连接到Kafka集群
  }

  async processData(data: any) {
    const enrichedData = {
      ...data,
      receivedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    await this.kafkaProducer.send({
      // 发送数据到Kafka
      topic: 'monitoring-events', // 主题名称
      messages: [{ value: JSON.stringify(enrichedData) }] // 消息内容
    })
  }
}
