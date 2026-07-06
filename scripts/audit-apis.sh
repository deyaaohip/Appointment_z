#!/bin/bash
TOKEN=$(curl -s http://localhost:3000/api/auth -H "Content-Type: application/json" -d '{"email":"admin@bookflow.com","password":"demo123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
ORIGIN="http://localhost:3000"
PASS=0; FAIL=0; ERRORS=""

test_api() {
  local method=$1 url=$2 data=$3 name=$4
  local resp
  if [ "$method" = "GET" ]; then
    resp=$(curl -s -w "\n%{http_code}" "$url" -H "Authorization: Bearer $TOKEN" -H "Origin: $ORIGIN" 2>&1)
  elif [ "$method" = "DELETE" ]; then
    resp=$(curl -s -w "\n%{http_code}" -X DELETE "$url" -H "Authorization: Bearer $TOKEN" -H "Origin: $ORIGIN" 2>&1)
  else
    resp=$(curl -s -w "\n%{http_code}" -X $method "$url" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -H "Origin: $ORIGIN" -d "$data" 2>&1)
  fi
  local code=$(echo "$resp" | tail -1)
  local body=$(echo "$resp" | sed '$d')
  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    echo "  PASS $name -> $code"
    PASS=$((PASS+1))
  else
    echo "  FAIL $name -> $code | $(echo "$body" | head -c 150)"
    FAIL=$((FAIL+1))
    ERRORS="$ERRORS\n  - $name: $code"
  fi
}

echo "====== COMPREHENSIVE API AUDIT ======"

echo "--- AUTH ---"
test_api "POST" "http://localhost:3000/api/auth" '{"email":"admin@bookflow.com","password":"demo123"}' "Login"

echo "--- DASHBOARD ---"
test_api "GET" "http://localhost:3000/api/dashboard" "" "Dashboard"

echo "--- BOOKINGS ---"
test_api "GET" "http://localhost:3000/api/bookings" "" "List bookings"
BID=$(curl -s "http://localhost:3000/api/bookings?limit=1" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['bookings'][0]['id'])" 2>/dev/null)
[ -n "$BID" ] && test_api "GET" "http://localhost:3000/api/bookings/$BID" "" "Booking detail"
[ -n "$BID" ] && test_api "PUT" "http://localhost:3000/api/bookings/$BID" '{"notes":"audit test"}' "Update booking"

echo "--- CUSTOMERS ---"
test_api "GET" "http://localhost:3000/api/customers" "" "List customers"
test_api "POST" "http://localhost:3000/api/customers" '{"firstName":"QA","lastName":"Test","email":"qa@test.com","phone":"+966599999999"}' "Create customer"
QCID=$(curl -s "http://localhost:3000/api/customers?search=QA" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['customers'][0]['id'])" 2>/dev/null)
[ -n "$QCID" ] && test_api "PUT" "http://localhost:3000/api/customers/$QCID" '{"city":"Riyadh"}' "Update customer"
[ -n "$QCID" ] && test_api "DELETE" "http://localhost:3000/api/customers/$QCID" "" "Delete customer"

echo "--- EMPLOYEES ---"
test_api "GET" "http://localhost:3000/api/employees" "" "List employees"
test_api "POST" "http://localhost:3000/api/employees" '{"name":"QA Emp","branchId":"cmqwmxd22000jqycq7j9h7bwb"}' "Create employee"
QEID=$(curl -s "http://localhost:3000/api/employees" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; es=json.load(sys.stdin)['employees']; print([e['id'] for e in es if 'QA' in e['name']][0])" 2>/dev/null)
[ -n "$QEID" ] && test_api "PUT" "http://localhost:3000/api/employees/$QEID" '{"specialization":"test"}' "Update employee"
[ -n "$QEID" ] && test_api "DELETE" "http://localhost:3000/api/employees/$QEID" "" "Delete employee"

echo "--- SERVICES ---"
test_api "GET" "http://localhost:3000/api/services" "" "List services"
test_api "POST" "http://localhost:3000/api/services" '{"name":"QA Svc","description":"t","duration":15,"price":100,"categoryId":"cmqwmxd2r0022qycqxmp9u4xu"}' "Create service"
QSID=$(curl -s "http://localhost:3000/api/services" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ss=json.load(sys.stdin)['services']; print([s['id'] for s in ss if 'QA' in s['name']][0])" 2>/dev/null)
[ -n "$QSID" ] && test_api "PUT" "http://localhost:3000/api/services/$QSID" '{"price":200}' "Update service"
[ -n "$QSID" ] && test_api "DELETE" "http://localhost:3000/api/services/$QSID" "" "Delete service"

echo "--- BRANCHES ---"
test_api "GET" "http://localhost:3000/api/branches" "" "List branches"
test_api "POST" "http://localhost:3000/api/branches" '{"name":"QA Br","phone":"+966500000000"}' "Create branch"
QBID=$(curl -s "http://localhost:3000/api/branches" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; bs=json.load(sys.stdin)['branches']; print([b['id'] for b in bs if 'QA' in b['name']][0])" 2>/dev/null)
[ -n "$QBID" ] && test_api "PUT" "http://localhost:3000/api/branches/$QBID" '{"name":"QA Br Up"}' "Update branch"
[ -n "$QBID" ] && test_api "DELETE" "http://localhost:3000/api/branches/$QBID" "" "Delete branch"

echo "--- COUPONS ---"
test_api "GET" "http://localhost:3000/api/coupons" "" "List coupons"
test_api "POST" "http://localhost:3000/api/coupons" '{"code":"QATEST2","type":"percentage","value":20}' "Create coupon"

echo "--- ROLES ---"
test_api "GET" "http://localhost:3000/api/roles" "" "List roles"

echo "--- OTHER ---"
test_api "GET" "http://localhost:3000/api/notifications" "" "Notifications"
test_api "GET" "http://localhost:3000/api/audit-logs" "" "Audit logs"
test_api "GET" "http://localhost:3000/api/payments" "" "Payments"
test_api "GET" "http://localhost:3000/api/subscriptions" "" "Subscriptions"
test_api "GET" "http://localhost:3000/api/availability" "" "Availability"
test_api "GET" "http://localhost:3000/api/tenant-settings" "" "Tenant settings"
test_api "GET" "http://localhost:3000/api/brand-settings" "" "Brand settings"
test_api "GET" "http://localhost:3000/api/admin/tenants" "" "Admin tenants"

echo ""
echo "====== RESULTS: $PASS PASS | $FAIL FAIL ======"
[ $FAIL -gt 0 ] && echo -e "FAILED:$ERRORS"