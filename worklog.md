---
Task ID: 1
Agent: main
Task: Fix Internal Server Error on preview URL - add demo mode fallback

Work Log:
- Diagnosed root cause: preview URL runs as serverless function where SQLite DB is unavailable
- Created /src/lib/demo-data.ts with rich Arabic demo data (10 customers, 5 employees, 8 services, 4 branches, 18 bookings, 3 coupons, etc.)
- Created /src/lib/demo-mode.ts with isDatabaseAvailable() detector
- Created /src/lib/demo-responses.ts with response builders matching every API route shape
- Rewrote /src/app/api/auth/route.ts to auto-fallback to demo mode when DB fails
- Added demo fallback to 16 collection routes via automated script
- Added demo fallback to 8 [id] routes via subagent (23 handlers total)
- Updated CORS origins to include https://y12n35wyv181-d.space-z.ai
- Local testing confirms all APIs still work with real DB

Stage Summary:
- All 25 API routes now support demo mode fallback
- Auth route catches ALL errors and falls back to demo login
- Preview URL should now work without SQLite database
