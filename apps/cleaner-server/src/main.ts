import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'

dotenv.config() // 加载 .env 文件
console.log('PORT:', process.env.PORT)
async function bootstrap() {
  console.log('Starting Cleaner Server...')
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  console.log('Cleaner Server started successfully')
  try {
    await app.listen(process.env.PORT || 3000, '0.0.0.0') // 监听所有 IP 地址
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`)
  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1) // 退出进程
  }
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
}
bootstrap()
