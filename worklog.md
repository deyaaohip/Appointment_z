---
Task ID: 1
Agent: Main Agent
Task: Fix super admin dashboard crash and rebuild all 14 pages with responsive design and working buttons

Work Log:
- Investigated crash: missing imports (Globe, UserPlus) in super-admin-dashboard.tsx caused "This page couldn't load"
- Removed duplicate old file at /components/admin/super-admin-dashboard.tsx
- Rewrote /components/super-admin/super-admin-dashboard.tsx (74K chars) with all 14 functional pages
- Fixed /components/super-admin/super-admin-sidebar.tsx for RTL-aware collapse button, mobile Sheet, removed duplicate menu button
- Fixed /app/page.tsx to remove redundant AnimatePresence wrapper around SA dashboard
- All 14 pages now have working buttons: add/edit/delete/suspend with dialogs, toast feedback
- Responsive design: mobile-first grids, scrollable tables, hidden columns on small screens
- Security: useEffect token validation, auto-redirect if no auth
- Performance: useMemo for filtered data, useCallback for handlers, lazy page rendering via PAGE_MAP

Stage Summary:
- Super admin dashboard now loads without crash
- All 14 pages implemented: overview, tenants, users, plans, billing, roles, audit, notifications, reports, system health, servers, database, security, settings
- All buttons functional with proper dialogs, confirmations, and toast feedback
- Fully responsive for mobile/tablet/desktop
- RTL-aware sidebar collapse button
- Build passes with zero errors