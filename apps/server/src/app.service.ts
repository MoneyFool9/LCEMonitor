// app.service.ts
import { Injectable } from '@nestjs/common'
import { Kafka, Producer } from 'kafkajs'

@Injectable()
export class AppService {
  private kafkaProducer: Producer
  constructor() {
    const kafka = new Kafka({
      clientId: 'monitoring-service',
      brokers: [process.env.KAFKA_BROKER]
    })

    this.kafkaProducer = kafka.producer()
    this.kafkaProducer.connect()
  }

  async processData(data: any) {
    const enrichedData = {
      ...data,
      receivedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    await this.kafkaProducer.send({
      topic: 'monitoring-events',
      messages: [{ value: JSON.stringify(enrichedData) }]
    })
  }
}
