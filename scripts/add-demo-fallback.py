#!/usr/bin/env python3
"""Add demo-mode fallback to all API routes that import from @/lib/db"""

import re, os

BASE = '/home/z/my-project/src/app/api'

# Map of route path -> demo response function name
ROUTE_DEMO_MAP = {
    'dashboard/route.ts': ('demoDashboard()', 'demo-responses'),
    'bookings/route.ts': ('demoBookingsList(page, limit, status, search)', 'demo-responses'),
    'customers/route.ts': ('demoCustomersList(page, limit, search)', 'demo-responses'),
    'employees/route.ts': ('demoEmployeesList(page, limit, search)', 'demo-responses'),
    'services/route.ts': ('demoServicesList(page, limit, search)', 'demo-responses'),
    'branches/route.ts': ('demoBranchesList()', 'demo-responses'),
    'coupons/route.ts': ('demoCouponsList(page, limit)', 'demo-responses'),
    'roles/route.ts': ('demoRolesList()', 'demo-responses'),
    'payments/route.ts': ('demoPaymentsList(page, limit)', 'demo-responses'),
    'notifications/route.ts': ('demoNotifications()', 'demo-responses'),
    'audit-logs/route.ts': ('demoAuditLogs(page, limit)', 'demo-responses'),
    'tenant-settings/route.ts': ('demoTenantSettings()', 'demo-responses'),
    'brand-settings/route.ts': ('demoBrandSettings()', 'demo-responses'),
    'availability/route.ts': ('demoAvailability()', 'demo-responses'),
    'subscriptions/route.ts': ('demoSubscriptions()', 'demo-responses'),
    'admin/tenants/route.ts': ('demoAdminTenants()', 'demo-responses'),
}

# Routes with [id] parameter - need demo fallback for GET by ID
ID_ROUTES = {
    'bookings/[id]/route.ts': ('demoBookingById', 'demo-responses'),
    'customers/[id]/route.ts': None,
    'employees/[id]/route.ts': None,
    'services/[id]/route.ts': None,
    'branches/[id]/route.ts': None,
    'coupons/[id]/route.ts': None,
    'roles/[id]/route.ts': None,
}

def add_demo_fallback(filepath, demo_import_name, demo_func_call):
    """Add demo mode fallback to a route file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Skip if already has demo fallback
    if 'isDatabaseAvailable' in content or 'demoMode' in content or 'demo-' in content:
        print(f"  SKIP (already has demo): {filepath}")
        return
    
    # Add imports at the top (after the last import line)
    demo_import = f"import {{ isDatabaseAvailable }} from '@/lib/demo-mode'\n"
    if demo_import_name:
        demo_import += f"import {{ {demo_import_name} }} from '@/lib/demo-responses'\n"
    
    # Find the last import line
    import_lines = list(re.finditer(r'^import .+$', content, re.MULTILINE))
    if import_lines:
        last_import = import_lines[-1]
        insert_pos = last_import.end()
        content = content[:insert_pos] + '\n' + demo_import + content[insert_pos:]
    
    # For [id] routes, we add a simpler wrapper
    if demo_func_call is None:
        # Just add DB availability check at the start of each handler
        # We'll wrap the entire handler body in try/catch
        # Find each export async function
        pattern = r'(export async function (GET|POST|PUT|PATCH|DELETE)\(request[^)]*\)\s*\{)'
        matches = list(re.finditer(pattern, content))
        if matches:
            # Add a generic demo fallback at the top of the file
            # and modify catch blocks
            # Simplest: add a demo error handler import
            print(f"  ID-ROUTE (manual needed): {filepath}")
        return
    
    # For collection routes with GET handler
    # Wrap the try block to catch DB errors and return demo data
    # Find 'try {' after GET handler
    get_match = re.search(r'export async function GET\(', content)
    if get_match:
        # Add demo check at the start of the try block
        # Find the first try { after GET
        try_match = re.search(r'try \{', content[get_match.start():])
        if try_match:
            abs_pos = get_match.start() + try_match.end()
            
            # Extract search params for the demo call
            demo_call = demo_func_call
            
            # Need to figure out what variables the demo call needs
            # Parse page, limit, etc from the original code
            needs_search = 'search' in demo_call
            needs_status = 'status' in demo_call
            needs_page = 'page' in demo_call or 'limit' in demo_call
            
            demo_check = ""
            if needs_page or needs_status or needs_search:
                demo_check = f"""
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {{
      const sp = new URL(request.url).searchParams
      const page = parseInt(sp.get('page') || '1')
      const limit = parseInt(sp.get('limit') || '20')"""
                if needs_search:
                    demo_check += "\n      const search = sp.get('search') || undefined"
                if needs_status:
                    demo_check += "\n      const status = sp.get('status') || undefined"
                demo_check += f"""
      return ok({demo_call}, request.headers.get('origin'))
    }}
"""
            else:
                demo_check = f"""
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {{
      return ok({demo_call}, request.headers.get('origin'))
    }}
"""
            
            content = content[:abs_pos] + demo_check + content[abs_pos:]
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"  OK: {filepath}")

# Process all routes
for rel_path, (demo_func, demo_module) in ROUTE_DEMO_MAP.items():
    filepath = os.path.join(BASE, rel_path)
    if os.path.exists(filepath):
        import_name = demo_func.split('(')[0]  # e.g., demoDashboard
        add_demo_fallback(filepath, import_name, demo_func)
    else:
        print(f"  MISSING: {filepath}")

print("\nDone!")