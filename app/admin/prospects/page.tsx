import { redirect } from 'next/navigation'

/** Canonical recruitment UI lives at /superadmin */
export default function AdminProspectsRedirectPage() {
  redirect('/superadmin')
}
