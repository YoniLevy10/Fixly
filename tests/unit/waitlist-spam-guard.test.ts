import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { looksLikeSpamWaitlist } from '@/lib/waitlist/spam-guard'
import {
  OTHER_PROFESSION,
  joinWaitlistProfessions,
} from '@/lib/waitlist/profession-options'
import { waitlistSchema } from '@/lib/api/schemas'

/** Appendix fixture: real-world names/phones that used to false-reject. */
const ACCEPT_FIXTURE: Array<{ fullName: string; phone: string; note: string }> = [
  { fullName: 'יוני לוי', phone: '0501234567', note: 'hebrew mobile' },
  { fullName: 'محمد أحمد', phone: '0527654321', note: 'arabic mobile' },
  { fullName: 'طارق علي', phone: '0541112233', note: 'arabic mobile 2' },
  { fullName: "O'Reilly", phone: '0509876543', note: 'latin apostrophe' },
  { fullName: 'Jean-Pierre', phone: '0531234567', note: 'latin hyphen' },
  { fullName: 'דני (כהן)', phone: '0502223344', note: 'hebrew parens' },
  { fullName: 'יוסי & דנה', phone: '0503334455', note: 'ampersand' },
  { fullName: 'משה׳כהן', phone: '0504445566', note: 'geresh' },
  { fullName: '״דוד״ לוי', phone: '0505556677', note: 'gershayim' },
  { fullName: 'A. Cohen', phone: '0506667788', note: 'initials' },
  { fullName: 'רמי 2', phone: '0507778899', note: 'digit in name' },
  { fullName: 'שמעון / יוסי', phone: '0508889900', note: 'slash' },
  { fullName: 'נורית, כהן', phone: '0509990011', note: 'comma' },
  { fullName: 'בעל מקצוע', phone: '02-5312345', note: 'jerusalem landline' },
  { fullName: 'טל אביב', phone: '03-5123456', note: 'tel aviv landline' },
  { fullName: 'חיפאי', phone: '04-8123456', note: 'haifa landline' },
  { fullName: 'דרום', phone: '08-9123456', note: 'south landline' },
  { fullName: 'שרון', phone: '09-7412345', note: 'sharon landline' },
  { fullName: 'VoIP Pro', phone: '072-1234567', note: 'voip 07x' },
  { fullName: 'בינלאומי', phone: '+972501234567', note: '972 mobile' },
  { fullName: 'קווי 972', phone: '+9722-5312345', note: '972 landline' },
]

describe('waitlist spam-guard appendix fixture', () => {
  it('accepts all 21 real-world rows with zero false rejections', () => {
    assert.equal(ACCEPT_FIXTURE.length, 21)
    for (const row of ACCEPT_FIXTURE) {
      assert.equal(
        looksLikeSpamWaitlist({ fullName: row.fullName, phone: row.phone }),
        null,
        `false reject: ${row.note} (${row.fullName} / ${row.phone})`,
      )
    }
  })

  it('still rejects September 2026 ASCII keyboard-smash', () => {
    assert.ok(
      looksLikeSpamWaitlist({
        fullName: 'pedwreFzMpiwUhuDpVLq',
        phone: 'LIbsJgoQmFieDVKUV',
        city: 'gxPRWxvLSiRSLBtrP',
        category: 'rBqUrBxZnhEUpArAEu',
      }),
    )
  })

  it('rejects impossible IL prefixes and too-short phones', () => {
    assert.ok(
      looksLikeSpamWaitlist({ fullName: 'דני כהן', phone: '12345' }),
    )
    assert.ok(
      looksLikeSpamWaitlist({ fullName: 'דני כהן', phone: '0601234567' }),
    )
  })
})

describe('other profession', () => {
  it('joins אחר to free-text and never null for valid custom', () => {
    assert.equal(
      joinWaitlistProfessions([OTHER_PROFESSION], 'התקנת פרגולות עץ'),
      'התקנת פרגולות עץ',
    )
    assert.equal(
      joinWaitlistProfessions(['חשמלאים', OTHER_PROFESSION], 'תיקון כלי נגינה'),
      'חשמלאים, תיקון כלי נגינה',
    )
    assert.equal(joinWaitlistProfessions([OTHER_PROFESSION], 'א'), null)
  })

  it('schema accepts אחר + otherProfession and requires detail text', () => {
    const ok = waitlistSchema.safeParse({
      fullName: 'בעל מקצוע',
      phone: '0501112233',
      audience: 'professional',
      categories: [OTHER_PROFESSION],
      otherProfession: 'תיקון כלי נגינה',
    })
    assert.equal(ok.success, true)

    const missing = waitlistSchema.safeParse({
      fullName: 'בעל מקצוע',
      phone: '0501112233',
      audience: 'professional',
      categories: [OTHER_PROFESSION],
    })
    assert.equal(missing.success, false)
    if (!missing.success) {
      const msgs = missing.error.issues.map((i) => i.message)
      assert.ok(msgs.includes('נא לפרט את המקצוע'))
    }
  })
})
