import dayjs from 'dayjs'
/**
 * generate a timestamp string into an ISO 8601 date string.
 *
 * @export
 * @param {}
 * @returns {string}
 */
export function generateTimeStamp(): string {
  const date = new Date()
  return dayjs(date.toISOString()).format('YYYY-MM-DD HH:mm:ss')
}

export function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function bin2hex(str: string) {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += int16_to_hex(str.charCodeAt(i))
  }
  return result
}

function int16_to_hex(i: number) {
  let result = i.toString(16)
  let j = 0
  while (j + result.length < 4) {
    result = '0' + result
    j++
  }
  return result
}
// 生成uuid
export function get_uuid() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const txt = window.location.host
  ctx.textBaseline = 'top'
  ctx.font = "14px 'Arial'"
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#f60'
  ctx.fillRect(125, 1, 62, 20)
  ctx.fillStyle = '#069'
  ctx.fillText(txt, 2, 15)
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
  ctx.fillText(txt, 4, 17)

  const b64 = canvas.toDataURL().replace('data:image/png;base64,', '')
  const bin = atob(b64)
  const crc = bin2hex(bin.slice(-16, -12))
  return crc
}
