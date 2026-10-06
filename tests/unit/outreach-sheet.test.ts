import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  contentHash,
  parseCsv,
  parseOutreachGrid,
  planOutreachSync,
  type ExistingOutreachProspect,
  type SheetLead,
} from '../../lib/prospects/outreach-sheet'

const csv = [
  'אזור,שם בעל המקצוע,טלפון מלא,תחומי עבודה,מקור,סטטוס,הערות,מזהה',
  'צפון,רון הנדימן,058-414-0298,הנדימן,שיחה,נשלחה הודעה,הערה,',
  'צפון,רון הנדימן,0584140298,הנדימן,שיחה,נשלחה הודעה,הערה,',
  'שרון,האלופים,050-668-7575,שיפוצים,שיחה,לא רלוונטי,גדולים,',
  'לא ידוע,להשלמה – סיומת 4222,054-235-4222,,שיחה,נשלחה הודעה,"הטלפון המלא, השם והאזור לא זמינים",',
  'מרכז,נרשם כבר,052-111-1111,הנדימן,שיחה,,,' ,
  'דרום,בלי טלפון,,הנדימן,שיחה,,,',
].join('\n')

function existing(partial: Partial<ExistingOutreachProspect> & Pick<ExistingOutreachProspect, 'id' | 'phoneNormalized'>): ExistingOutreachProspect {
  return {
    name: 'קיים',
    phone: partial.phoneNormalized,
    city: 'ירושלים',
    status: 'discovered',
    notes: null,
    services: [],
    waitlistId: null,
    link: null,
    ...partial,
  }
}

describe('outreach sheet sync', () => {
  it('parses quoted commas and keeps one row per phone', () => {
    const leads = parseOutreachGrid(parseCsv(csv))
    assert.equal(leads.length, 6)
    assert.equal(leads[3]?.notes.includes('השם והאזור'), true)
    const plan = planOutreachSync(leads, [], [])
    assert.equal(plan.creates.length, 4)
    assert.equal(plan.skips.filter((skip) => skip.reason === 'כפילות בגיליון').length, 1)
    assert.equal(plan.skips.some((skip) => skip.reason === 'אין טלפון תקין'), true)
    assert.equal(plan.creates.find((lead) => lead.name === 'האלופים')?.status, 'rejected')
    assert.equal(plan.creates.find((lead) => lead.name === 'רון הנדימן')?.status, 'contacted')
    assert.equal(plan.creates.find((lead) => lead.name === 'רון הנדימן')?.categorySlug, 'handyman')
    assert.equal(plan.creates.find((lead) => lead.name === 'האלופים')?.categorySlug, 'renovations')
  })

  it('does not create a second lead for a phone that already exists', () => {
    const leads = parseOutreachGrid(parseCsv(csv))
    const plan = planOutreachSync(
      leads,
      [existing({ id: '11111111-1111-1111-1111-111111111111', phoneNormalized: '972584140298', name: 'רון ממקור אחר' })],
      [],
    )
    assert.equal(plan.creates.some((lead) => lead.phoneNormalized === '972584140298'), false)
    const update = plan.updates.find((row) => row.id === '11111111-1111-1111-1111-111111111111')
    assert.equal(update?.status, 'contacted')
    assert.equal(update?.name, 'רון הנדימן')
  })

  it('does not merge an uncertain sheet phone onto a different existing lead', () => {
    const leads = parseOutreachGrid(parseCsv(csv))
    const plan = planOutreachSync(
      leads,
      [existing({ id: '22222222-2222-2222-2222-222222222222', phoneNormalized: '972542354222', name: 'Handy Vadim' })],
      [],
    )
    assert.equal(plan.creates.some((lead) => lead.phoneNormalized === '972542354222'), false)
    assert.equal(plan.updates.some((row) => row.id.startsWith('2222')), false)
    assert.equal(plan.skips.some((skip) => skip.reason.includes('לא ודאי')), true)
  })

  it('keeps registered people out of the outreach leads', () => {
    const leads = parseOutreachGrid(parseCsv(csv))
    const plan = planOutreachSync(leads, [], ['052-111-1111'])
    assert.equal(plan.creates.some((lead) => lead.name === 'נרשם כבר'), false)
    assert.equal(plan.skips.some((skip) => skip.reason === 'כבר נרשם'), true)
  })

  it('does not downgrade a contacted lead when the sheet status is empty', () => {
    const lead = parseOutreachGrid(parseCsv(csv)).find((row) => row.name === 'נרשם כבר') as SheetLead
    const plan = planOutreachSync(
      [lead],
      [existing({
        id: '33333333-3333-3333-3333-333333333333',
        phoneNormalized: '972521111111',
        status: 'contacted',
        name: 'נרשם כבר',
        city: 'מרכז',
        services: ['הנדימן'],
      })],
      [],
    )
    assert.equal(plan.updates[0]?.status, 'contacted')
    assert.equal(plan.updates[0]?.pushStatus, true)
  })

  it('pushes admin edits back and ignores an unchanged linked row', () => {
    const [lead] = parseOutreachGrid(parseCsv('אזור,שם בעל המקצוע,טלפון מלא,תחומי עבודה,מקור,סטטוס,הערות\nצפון,רון,058-414-0298,הנדימן,שיחה,נשלחה הודעה,\n'))
    assert.ok(lead)
    const hash = contentHash({
      region: 'צפון',
      name: 'רון',
      phoneNormalized: '972584140298',
      trades: 'הנדימן',
      statusLabel: 'נשלחה הודעה',
      notes: '',
    })
    const linked = existing({
      id: '44444444-4444-4444-4444-444444444444',
      phoneNormalized: '972584140298',
      name: 'רון',
      city: 'צפון',
      status: 'contacted',
      services: ['הנדימן'],
      link: { row: 2, sheetHash: hash, dbHash: hash, pendingPush: false },
    })
    assert.equal(planOutreachSync([lead], [linked], []).updates.length, 0)

    const edited = { ...linked, status: 'interested' as const }
    const pushed = planOutreachSync([lead], [edited], []).updates[0]
    assert.equal(pushed?.pushFields, true)
    assert.equal(pushed?.status, 'interested')
  })
})
