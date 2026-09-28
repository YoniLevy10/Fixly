/**
 * Nationwide consumer launch — open create-request for every city in Israel.
 * Set NEXT_PUBLIC_FF_NATIONWIDE=true (or FIXLY_NATIONWIDE=true) in production.
 */
export function isNationwideConsumerOpen(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_FF_NATIONWIDE?.trim().toLowerCase() ||
    process.env.FIXLY_NATIONWIDE?.trim().toLowerCase()
  return flag === 'true' || flag === '1' || flag === 'on'
}
