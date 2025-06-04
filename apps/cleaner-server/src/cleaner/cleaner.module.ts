import { Module } from '@nestjs/common'
import { CleanerService } from './cleaner.service'

@Module({
  providers: [CleanerService]
})
export class CleanerModule {}
