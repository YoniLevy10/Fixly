# Acquisition URLs — מה מוביל לאן

מקור אמת אחד לקמפיינים, ללידים ולאפליקציה. **אל תמציאו קישורים חדשים** בלי לעדכן את הקובץ הזה.

## המפה (קנוני)

| מטרה | URL קנוני | למי | מה קורה |
|------|-----------|-----|---------|
| **קמפיין ביקוש / רשימת מעוניינים** | [`https://fixly.tech/waitlist`](https://fixly.tech/waitlist) | לקוחות / מתעניינים | דף נחיתה מעוצב (`PrelaunchLanding`) → `POST /api/waitlist` → טבלת `pro_waitlist` עם `audience=customer` |
| **אנשי מקצוע (מנוע לידים / WhatsApp)** | [`https://fixly.tech/pro/join`](https://fixly.tech/pro/join) | בעלי מקצוע | טופס הצטרפות → `POST /api/pro/waitlist` → אותה טבלה, `audience=professional` |
| **אפליקציית הדגמה (משקיעים / מוצר)** | [`https://fixly.tech/`](https://fixly.tech/) | גולשים פנימיים | `HomeScreen` כל עוד הדמו פעיל (`NEXT_PUBLIC_FF_DEMO_KILL` לא `true`) |
| **סיור משקיע** | [`https://fixly.tech/demo`](https://fixly.tech/demo) | משקיעים | מתחיל demo tour |

## מה לא להשתמש בו

| URL | סטטוס |
|-----|--------|
| `https://fixly.tech/?utm_…` לקמפיין רשימה | **לא** — `/` הוא דמו מוצר; מפנים ל־`/waitlist` |
| `/go/…` | מתים — מופנים ל־`/waitlist` |
| טופס בעלי מקצוע בתוך `/waitlist` | הוסר — בעלי מקצוע רק ב־`/pro/join` |

## Meta / paid — קישור להעתקה

```
https://fixly.tech/waitlist?utm_source=meta&utm_medium=paid&utm_campaign=weekend_waitlist&utm_content=feed_v1
```

אנשי מקצוע ממודעות / WhatsApp של מנוע הלידים:

```
https://fixly.tech/pro/join?utm_source=outreach&utm_medium=whatsapp&utm_campaign=pro_leads
```

(`JOIN_URL` ב־`lib/prospects/config.ts` כבר מצביע ל־`/pro/join`.)

## איפה רואים את הרשימות

- `/admin` — כל רשומות ההמתנה (`pro_waitlist`)
- `/superadmin` — מנוע לידים / outreach לבעלי מקצוע

## אחרי מימון / כיבוי דמו

כש־`NEXT_PUBLIC_FF_DEMO_KILL=true` ו־prelaunch פעיל: גם `/` על `fixly.tech` מציג את דף הנחיתה. **עדיין** עדיף לשמור את ה־destination של המודעות על `/waitlist` (יציב, לא תלוי בדגלים).
