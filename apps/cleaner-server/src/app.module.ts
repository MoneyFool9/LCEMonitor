import { Module } from '@nestjs/common'
import { CleanerModule } from './cleaner/cleaner.module'

@Module({
  imports: [CleanerModule]
})
export class AppModule {}
