import LCEMonitor from '@lce-monitor/jssdk/src/index'
export const sdk = new LCEMonitor({
  endpoint: 'http://localhost:3000/report',
  batch: true,
  batchSize: 10
})
