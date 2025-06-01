import { Body, Controller, Get, Post } from '@nestjs/common'
import { AppService } from './app.service'
import { ClickhouseService } from './clickhouse.service'

@Controller('monitoring')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly clickhouseService: ClickhouseService
  ) {}
  @Post()
  async receiveData(@Body() data: any) {
    await this.appService.processData(data)
    return {
      status: 'success'
    }
  }
  @Get('all')
  async getData() {
    return await this.clickhouseService.selectData()
  }
}
