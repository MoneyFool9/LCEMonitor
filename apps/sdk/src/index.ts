import { add } from '@lce-monitor/utils'
import qs from 'qs'
import { test } from './test'

const obj = {
  a: 1,
  b: 2
}
function main() {
  console.log('sum:', add(1, 2))
  test()
  console.log(qs.stringify(obj))
}

main()
