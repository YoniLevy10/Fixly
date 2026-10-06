# Recruitment SMS

Superadmin → “כתיבת הודעה ושליחת SMS לכל אנשי המקצוע” → `/superadmin/sms`.
Audience: all `professional_prospects` rows with an Israeli mobile number (phone,
falling back to WhatsApp phone). Numbers are normalized and deduplicated. A
`do_not_contact` row suppresses that number across other rows too. This does not
use website waitlist registrations or the current recruitment screen filters.

Before enabling:

1. Apply the `lead_sms_campaigns` migration.
2. Configure server-only `SMS_019_USERNAME`, `SMS_019_TOKEN`, `SMS_019_SENDER`.
3. Deploy and use an existing admin session (email or password gate).

019 API reference: https://docs.019sms.co.il/sms/send-sms.html
One SMS request contains the full audience and adds 019's unsubscribe link.
Provider acceptance is displayed as acceptance, not proof of handset delivery.

A campaign UUID is saved in browser storage before sending and reserved with a
unique DB insert before contacting 019. Concurrent retries with that UUID cannot
resubmit. A changed recipient snapshot requires refreshing the preview.
Timeouts and ambiguous responses stay `unknown` (or `submitting` if the process
stopped): check the 019 dashboard using `Fixly-<campaign UUID>`. Never retry an
ambiguous submission automatically. If confirmed not submitted, an operator can
mark it rejected in the ledger after checking 019, then check status in the UI.

No real SMS is sent by unit tests. Provider tests use mocked fetch.

## New registration alerts

New public website registrations (`pro_waitlist`, both audiences, including the
legacy `/api/pro/waitlist` route) queue one owner SMS atomically through an invoker
trigger. No historical registrations are backfilled. An `after` callback submits
the alert after the registration response; a cron every ten minutes picks up
pending alerts. A conditional status update prevents callback/cron duplicates.
Ambiguous delivery is held for manual inspection rather than retried.

Approved sender: `SMS_019_SENDER=0552819086`. Alerts go to `0552819086` by default;
override with server-only `SMS_SIGNUP_NOTIFY_PHONE`. Alerts include name, phone,
audience and city. They do not include an unsubscribe link. Alerts remain queued
while 019 credentials are missing. This covers public registration forms, not
Google sign-in alone.
