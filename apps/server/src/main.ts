import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'

dotenv.config() // 加载 .env 文件
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  await app.listen(process.env.PORT || 3000)
  console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`)
}
bootstrap()
