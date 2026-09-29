import { redirect } from 'next/navigation'

/**
 * Canonical pro registration is now `/waitlist?audience=professional`.
 * Keep this path for outreach / WhatsApp deep links.
 */
export default function ProJoinPage() {
  redirect('/waitlist?audience=professional')
}
