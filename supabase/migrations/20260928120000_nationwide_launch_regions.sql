-- Nationwide consumer launch: open Israeli cities for create-request.
-- Runtime flag NEXT_PUBLIC_FF_NATIONWIDE=true also bypasses city checks.

do $$
declare
  city_name text;
  cities text[] := array[
    'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'ראשון לציון', 'פתח תקווה',
    'אשדוד', 'נתניה', 'חולון', 'בני ברק', 'רמת גן', 'אשקלון', 'רחובות',
    'בת ים', 'הרצליה', 'כפר סבא', 'מודיעין', 'רעננה', 'הוד השרון',
    'רמת השרון', 'גבעתיים', 'קריית אונו', 'נס ציונה', 'יבנה', 'לוד',
    'רמלה', 'נצרת', 'עכו', 'טבריה', 'אילת', 'דימונה', 'קריית גת',
    'קריית שמונה', 'צפת', 'חדרה', 'פרדס חנה', 'זכרון יעקב', 'יקנעם',
    'עפולה', 'בית שמש', 'מודיעין עילית', 'אלעד', 'אום אל-פחם',
    'סחנין', 'שפרעם', 'נהריה', 'כרמיאל', 'מעלות', 'קריית ביאליק',
    'קריית מוצקין', 'קריית ים', 'טירה', 'טייבה', 'קלנסווה', 'אור יהודה',
    'יהוד', 'גבעת שמואל', 'ראש העין', 'כפר יונה', 'פרדסיה', 'תל מונד',
    'אבן יהודה', 'קדימה', 'בנימינה', 'אור עקיבא', 'קיסריה', 'מצפה רמון',
    'ערד', 'ירוחם', 'שדרות', 'נתיבות', 'אופקים', 'קריית מלאכי', 'גדרה',
    'גן יבנה', 'מזכרת בתיה', 'באר יעקב', 'שוהם', 'מבשרת ציון',
    'מעלה אדומים', 'אריאל', 'ביתר עילית'
  ];
begin
  foreach city_name in array cities loop
    if not exists (
      select 1 from public.launch_regions
      where category_id is null and lower(city) = lower(city_name)
    ) then
      insert into public.launch_regions (city, category_id, status, notes)
      values (city_name, null, 'open', 'Nationwide launch');
    else
      update public.launch_regions
      set status = 'open',
          notes = case
            when notes is null or btrim(notes) = '' then 'Nationwide launch'
            when notes ilike '%Nationwide%' then notes
            else notes || ' | Nationwide launch'
          end,
          updated_at = now()
      where category_id is null and lower(city) = lower(city_name);
    end if;
  end loop;

  -- Any other city-wide rows still closed/waitlist → open
  update public.launch_regions
  set status = 'open',
      notes = case
        when notes is null or btrim(notes) = '' then 'Nationwide launch'
        when notes ilike '%Nationwide%' then notes
        else notes || ' | Nationwide launch'
      end,
      updated_at = now()
  where category_id is null
    and status is distinct from 'open';
end $$;
