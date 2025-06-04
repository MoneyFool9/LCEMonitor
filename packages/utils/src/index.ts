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
