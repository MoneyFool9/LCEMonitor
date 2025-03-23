import { Injectable } from '@nestjs/common'
import { Consumer, Kafka } from 'kafkajs'
import { ClickhouseService } from './clickhouse.service'

@Injectable()
export class KafkaService {
  private kafkaConsumer: Consumer

  constructor(private readonly clickhouseService: ClickhouseService) {
    const kafka = new Kafka({
      clientId: 'monitoring-service',
      brokers: [process.env.KAFKA_BROKER]
    })

    this.kafkaConsumer = kafka.consumer({ groupId: 'monitoring-group' })
  }

  async onModuleInit() {
    await this.kafkaConsumer.connect()
    await this.kafkaConsumer.subscribe({ topic: 'monitoring-events', fromBeginning: true })

    this.kafkaConsumer.run({
      eachMessage: async ({ message }) => {
        const eventData = JSON.parse(message.value.toString())
        // 在这里处理数据，例如推送到clickhouse或进行实时分析
        await this.processEventData(eventData)
      }
    })
  }

  async processEventData(data: any) {
    // 在这里进行数据的清洗、聚合等处理
    console.log(`Received event: ${data.event_type}`)
    // 推送数据到clickhouse
    this.clickhouseService.insertData(data)
  }
}
