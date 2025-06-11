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
