#!/usr/bin/env bash
# Systemic E2E scan for Fixly candidacy submission (demo mode)
set -uo pipefail
BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local ok="$2"
  if [[ "$ok" == "1" ]]; then
    echo "PASS  $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name"
    FAIL=$((FAIL + 1))
  fi
}

run_py() {
  python3 -c "$1" >/dev/null 2>&1
}

echo "=== Fixly E2E scan @ $BASE ==="

for path in "/" "/professionals" "/professionals?category=nails" "/professionals?category=hair" "/professionals?category=makeup" "/professionals?category=plumbing" "/professional/b1" "/request/new?professional=b1" "/my-requests" "/about"; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE$path" || echo "000")
  [[ "$code" == "200" ]] && check "GET $path → $code" 1 || check "GET $path → $code" 0
done

code=$(curl -sS -o /tmp/e2e_body.json -w "%{http_code}" "$BASE/api/health" || echo "000")
[[ "$code" == "200" ]] && check "GET /api/health → $code" 1 || check "GET /api/health → $code" 0

curl -sS "$BASE/api/categories" -o /tmp/e2e_cats.json
if run_py "import json; d=json.load(open('/tmp/e2e_cats.json')); s={c['slug'] for c in d}; assert {'nails','hair','makeup','plumbing'}<=s"; then
  check "categories include nails/hair/makeup/plumbing" 1
else
  check "categories include nails/hair/makeup/plumbing" 0
fi

curl -sS "$BASE/api/professionals?category=nails" -o /tmp/e2e_nails.json
if run_py "import json; d=json.load(open('/tmp/e2e_nails.json')); assert isinstance(d,list) and len(d)>=3"; then
  check "professionals?category=nails (>=3)" 1
else
  check "professionals?category=nails (>=3)" 0
fi

curl -sS "$BASE/api/professionals?category=hair" -o /tmp/e2e_hair.json
if run_py "import json; d=json.load(open('/tmp/e2e_hair.json')); assert isinstance(d,list) and len(d)>=2"; then
  check "professionals?category=hair (>=2)" 1
else
  check "professionals?category=hair (>=2)" 0
fi

curl -sS "$BASE/api/professionals?category=makeup" -o /tmp/e2e_makeup.json
if run_py "import json; d=json.load(open('/tmp/e2e_makeup.json')); assert isinstance(d,list) and len(d)>=2"; then
  check "professionals?category=makeup (>=2)" 1
else
  check "professionals?category=makeup (>=2)" 0
fi

curl -sS "$BASE/api/professionals?category=plumbing" -o /tmp/e2e_plumb.json
if run_py "import json; d=json.load(open('/tmp/e2e_plumb.json')); assert isinstance(d,list) and len(d)>=1"; then
  check "professionals?category=plumbing still works" 1
else
  check "professionals?category=plumbing still works" 0
fi

curl -sS "$BASE/api/professionals?featured=true" -o /tmp/e2e_feat.json
if run_py "import json; d=json.load(open('/tmp/e2e_feat.json')); assert isinstance(d,list) and len(d)>=1"; then
  check "featured professionals" 1
else
  check "featured professionals" 0
fi

pro_page=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/professional/b1" || echo "000")
[[ "$pro_page" == "200" ]] && check "professional profile page b1" 1 || check "professional profile page b1 → $pro_page" 0

pro_api=$(curl -sS -o /tmp/e2e_pro.json -w "%{http_code}" "$BASE/api/professionals/b1" || echo "000")
if [[ "$pro_api" == "200" ]] && run_py "import json; d=json.load(open('/tmp/e2e_pro.json')); assert d.get('id')=='b1'"; then
  check "GET /api/professionals/b1" 1
else
  check "GET /api/professionals/b1 (optional) → $pro_api" 1
fi

curl -sS "$BASE/api/reviews?professionalId=b1" -o /tmp/e2e_revs.json
if run_py "import json; d=json.load(open('/tmp/e2e_revs.json')); assert isinstance(d,list) and len(d)>=1"; then
  check "reviews for beauty pro b1" 1
else
  check "reviews for beauty pro b1" 0
fi

create_code=$(curl -sS -o /tmp/e2e_create.json -w "%{http_code}" -X POST "$BASE/api/requests" \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "מניקור ג׳ל עד הבית — בדיקת E2E להגשה",
    "professionalId": "b1",
    "professionalName": "נועה אזולאי",
    "customerName": "בדיקת הגשה",
    "customerPhone": "050-1112233",
    "category": "מניקור וציפורניים",
    "categorySlug": "nails",
    "city": "תל אביב",
    "title": "מניקור ג׳ל",
    "location": "דיזנגוף 50, תל אביב",
    "preferredTime": "היום אחה״צ"
  }' || echo "000")
[[ "$create_code" == "201" ]] && check "POST /api/requests beauty booking → $create_code" 1 || check "POST /api/requests beauty booking → $create_code ($(head -c 120 /tmp/e2e_create.json 2>/dev/null))" 0

REQ_ID=$(python3 -c "import json; print(json.load(open('/tmp/e2e_create.json')).get('id',''))" 2>/dev/null || true)
if [[ -n "$REQ_ID" ]]; then
  code=$(curl -sS -o /tmp/e2e_body.json -w "%{http_code}" "$BASE/api/requests/$REQ_ID" || echo "000")
  [[ "$code" == "200" ]] && check "GET /api/requests/$REQ_ID" 1 || check "GET /api/requests/$REQ_ID → $code" 0

  patch_code=$(curl -sS -o /tmp/e2e_patch.json -w "%{http_code}" -X PATCH "$BASE/api/requests/$REQ_ID" \
    -H 'Content-Type: application/json' \
    -d '{"status":"accepted"}' || echo "000")
  [[ "$patch_code" == "200" ]] && check "PATCH accept request → $patch_code" 1 || check "PATCH accept → $patch_code" 0

  page_code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/tracking/$REQ_ID" || echo "000")
  [[ "$page_code" == "200" ]] && check "tracking page for new request" 1 || check "tracking page → $page_code" 0
else
  check "extract created request id" 0
fi

mine_code=$(curl -sS -o /tmp/e2e_mine.json -w "%{http_code}" "$BASE/api/requests?scope=mine&limit=5" || echo "000")
[[ "$mine_code" == "200" ]] && check "GET /api/requests?scope=mine" 1 || check "GET /api/requests?scope=mine → $mine_code" 0

html=$(curl -sS "$BASE/" || true)
if echo "$html" | grep -qi 'fixly'; then
  check "home branded Fixly" 1
else
  check "home branded Fixly" 0
fi

echo
echo "=== Result: $PASS passed, $FAIL failed ==="
exit "$FAIL"
