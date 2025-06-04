import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common'
import { ReportDto } from './report.dto'
import { ReportService } from './report.service'

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async report(@Body() body: ReportDto) {
    try {
      console.log('Received report:', body)
      await this.reportService.pushToQueue(body)
      return { message: 'Data received' }
    } catch (error) {
      console.error('Error processing report:', error)
      throw new HttpException('Invalid data', HttpStatus.BAD_REQUEST)
    }
  }
  @Get('show')
  async showData() {
    try {
      const data = await this.reportService.showData()
      return { data }
    } catch (error) {
      console.error('Error fetching data:', error)
      throw new HttpException('Failed to fetch data', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
