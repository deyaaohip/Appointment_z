import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'

const subscriptionActionSchema = z.object({
  action: z.enum(['cancel', 'upgrade', 'reactivate']),
  planSlug: z.string().optional(),
})

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ── Default plan definitions (seeded if missing) ─────────────────────
const DEFAULT_PLANS = [
  {
    slug: 'free',
    nameAr: 'مجاني',
    nameEn: 'Free',
    price: 0,
    interval: 'monthly',
    maxUsers: 1,
    maxEmployees: 2,
    maxBranches: 1,
    maxBookings: 50,
    maxServices: 5,
    maxStorage: 100,
    hasSms: false,
    hasWhatsapp: false,
    hasCalendarSync: false,
    hasReports: false,
    hasApiAccess: false,
    hasIntegrations: false,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    features: JSON.stringify(['basicBookings', 'basicCalendar', 'emailNotifications']),
  },
  {
    slug: 'starter',
    nameAr: 'الأساسية',
    nameEn: 'Starter',
    price: 49,
    interval: 'monthly',
    maxUsers: 3,
    maxEmployees: 5,
    maxBranches: 2,
    maxBookings: 500,
    maxServices: 20,
    maxStorage: 500,
    hasSms: false,
    hasWhatsapp: false,
    hasCalendarSync: true,
    hasReports: true,
    hasApiAccess: false,
    hasIntegrations: false,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    features: JSON.stringify(['basicBookings', 'basicCalendar', 'emailNotifications', 'calendarSync', 'basicReports', 'employeeManagement']),
  },
  {
    slug: 'professional',
    nameAr: 'الاحترافية',
    nameEn: 'Professional',
    price: 149,
    interval: 'monthly',
    maxUsers: 10,
    maxEmployees: 20,
    maxBranches: 5,
    maxBookings: 5000,
    maxServices: 50,
    maxStorage: 2000,
    hasSms: true,
    hasWhatsapp: true,
    hasCalendarSync: true,
    hasReports: true,
    hasApiAccess: true,
    hasIntegrations: true,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    features: JSON.stringify(['basicBookings', 'basicCalendar', 'emailNotifications', 'calendarSync', 'advancedReports', 'employeeManagement', 'sms', 'whatsapp', 'apiAccess', 'integrations']),
  },
  {
    slug: 'business',
    nameAr: 'الأعمال',
    nameEn: 'Business',
    price: 299,
    interval: 'monthly',
    maxUsers: 25,
    maxEmployees: 50,
    maxBranches: 15,
    maxBookings: 20000,
    maxServices: 100,
    maxStorage: 5000,
    hasSms: true,
    hasWhatsapp: true,
    hasCalendarSync: true,
    hasReports: true,
    hasApiAccess: true,
    hasIntegrations: true,
    hasWhiteLabel: true,
    hasCustomDomain: false,
    features: JSON.stringify(['basicBookings', 'basicCalendar', 'emailNotifications', 'calendarSync', 'advancedReports', 'employeeManagement', 'sms', 'whatsapp', 'apiAccess', 'integrations', 'whiteLabel']),
  },
  {
    slug: 'enterprise',
    nameAr: 'المؤسسية',
    nameEn: 'Enterprise',
    price: 599,
    interval: 'monthly',
    maxUsers: 999999,
    maxEmployees: 999999,
    maxBranches: 999999,
    maxBookings: 999999,
    maxServices: 999999,
    maxStorage: 50000,
    hasSms: true,
    hasWhatsapp: true,
    hasCalendarSync: true,
    hasReports: true,
    hasApiAccess: true,
    hasIntegrations: true,
    hasWhiteLabel: true,
    hasCustomDomain: true,
    features: JSON.stringify(['basicBookings', 'basicCalendar', 'emailNotifications', 'calendarSync', 'advancedReports', 'employeeManagement', 'sms', 'whatsapp', 'apiAccess', 'integrations', 'whiteLabel', 'customDomain', 'prioritySupport', 'dedicatedAccountManager']),
  },
] as const

// ── Seed plans if they don't exist ───────────────────────────────────
async function ensurePlansExist() {
  const existing = await db.subscriptionPlan.findMany({ select: { slug: true } })
  const existingSlugs = new Set(existing.map((p) => p.slug))

  for (const plan of DEFAULT_PLANS) {
    if (!existingSlugs.has(plan.slug)) {
      await db.subscriptionPlan.create({
        data: {
          name: plan.nameEn,
          slug: plan.slug,
          price: plan.price,
          interval: plan.interval,
          maxUsers: plan.maxUsers,
          maxEmployees: plan.maxEmployees,
          maxBranches: plan.maxBranches,
          maxBookings: plan.maxBookings,
          maxServices: plan.maxServices,
          maxStorage: plan.maxStorage,
          hasSms: plan.hasSms,
          hasWhatsapp: plan.hasWhatsapp,
          hasCalendarSync: plan.hasCalendarSync,
          hasReports: plan.hasReports,
          hasApiAccess: plan.hasApiAccess,
          hasIntegrations: plan.hasIntegrations,
          hasWhiteLabel: plan.hasWhiteLabel,
          hasCustomDomain: plan.hasCustomDomain,
          features: plan.features,
          isActive: true,
        },
      })
    }
  }
}

// ── Ensure tenant has a subscription ─────────────────────────────────
async function ensureTenantSubscription(tenantId: string) {
  let subscription = await db.tenantSubscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  })

  if (!subscription) {
    const freePlan = await db.subscriptionPlan.findUnique({
      where: { slug: 'free' },
    })
    const planId = freePlan?.id || (await db.subscriptionPlan.findFirst())?.id

    if (!planId) throw new Error('No plans available')

    const now = new Date()
    const endDate = new Date(now)
    endDate.setFullYear(endDate.getFullYear() + 1)

    subscription = await db.tenantSubscription.create({
      data: {
        tenantId,
        planId,
        status: 'active',
        startDate: now,
        endDate,
        trialEndsAt: null,
        lastBilledAt: now,
      },
      include: { plan: true },
    })
  }

  return subscription
}

// ── GET: Fetch subscription info (always returns data, never 404) ────
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'subscriptions', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    await ensurePlansExist()
    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }
    const subscription = await ensureTenantSubscription(tenant.id)

    // Calculate usage stats
    const [userCount, employeeCount, branchCount, bookingCount, serviceCount] =
      await Promise.all([
        db.tenantUser.count({ where: { tenantId: tenant.id, isActive: true } }),
        db.employee.count({ where: { tenantId: tenant.id, isActive: true } }),
        db.branch.count({ where: { tenantId: tenant.id, isActive: true } }),
        db.booking.count({ where: { tenantId: tenant.id } }),
        db.service.count({ where: { tenantId: tenant.id, isActive: true } }),
      ])

    const plan = subscription.plan

    // Estimate storage usage (approximate based on data)
    const storageUsed = Math.round(
      (userCount * 0.5 + employeeCount * 0.3 + branchCount * 0.2 + bookingCount * 0.1 + serviceCount * 0.15) * 10
    )

    // Build billing history from payments
    const recentPayments = await db.payment.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const billingHistory = recentPayments.map((p) => ({
      id: p.id,
      date: p.createdAt.toISOString(),
      amount: p.amount,
      status: p.status,
      method: p.method,
    }))

    // Get all plans for comparison
    const allPlans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    const plansComparison = allPlans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      interval: p.interval,
      maxUsers: p.maxUsers,
      maxEmployees: p.maxEmployees,
      maxBranches: p.maxBranches,
      maxBookings: p.maxBookings,
      maxServices: p.maxServices,
      maxStorage: p.maxStorage,
      hasSms: p.hasSms,
      hasWhatsapp: p.hasWhatsapp,
      hasCalendarSync: p.hasCalendarSync,
      hasReports: p.hasReports,
      hasApiAccess: p.hasApiAccess,
      hasIntegrations: p.hasIntegrations,
      hasWhiteLabel: p.hasWhiteLabel,
      hasCustomDomain: p.hasCustomDomain,
      features: JSON.parse(p.features || '[]'),
    }))

    return ok(
      {
        plan: {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          price: plan.price,
          interval: plan.interval,
          maxUsers: plan.maxUsers,
          maxEmployees: plan.maxEmployees,
          maxBranches: plan.maxBranches,
          maxBookings: plan.maxBookings,
          maxServices: plan.maxServices,
          maxStorage: plan.maxStorage,
          hasSms: plan.hasSms,
          hasWhatsapp: plan.hasWhatsapp,
          hasCalendarSync: plan.hasCalendarSync,
          hasReports: plan.hasReports,
          hasApiAccess: plan.hasApiAccess,
          hasIntegrations: plan.hasIntegrations,
          hasWhiteLabel: plan.hasWhiteLabel,
          hasCustomDomain: plan.hasCustomDomain,
          features: JSON.parse(plan.features || '[]'),
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          trialEndsAt: subscription.trialEndsAt,
          lastBilledAt: subscription.lastBilledAt,
          daysRemaining: Math.max(
            0,
            Math.ceil(
              (new Date(subscription.endDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          ),
        },
        usage: {
          users: { current: userCount, max: plan.maxUsers },
          employees: { current: employeeCount, max: plan.maxEmployees },
          branches: { current: branchCount, max: plan.maxBranches },
          bookings: { current: bookingCount, max: plan.maxBookings },
          services: { current: serviceCount, max: plan.maxServices },
          storage: { current: storageUsed, max: plan.maxStorage },
        },
        plans: plansComparison,
        billingHistory,
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Subscription error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ── POST: Upgrade / change plan or cancel subscription ───────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'subscriptions', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    await ensurePlansExist()
    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const body = await request.json()
    const parsed = subscriptionActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }
    const { action, planSlug } = parsed.data

    if (action === 'cancel') {
      const subscription = await db.tenantSubscription.findUnique({
        where: { tenantId: tenant.id },
      })
      if (!subscription) {
        return err('No subscription found', 404, request.headers.get('origin'))
      }

      const updated = await db.tenantSubscription.update({
        where: { id: subscription.id },
        data: { status: 'cancelled' },
      })

      return ok(
        {
          success: true,
          message: 'Subscription cancelled successfully',
          subscription: {
            id: updated.id,
            status: updated.status,
          },
        },
        request.headers.get('origin')
      )
    }

    if (action === 'reactivate') {
      const subscription = await db.tenantSubscription.findUnique({
        where: { tenantId: tenant.id },
      })
      if (!subscription) {
        return err('No subscription found', 404, request.headers.get('origin'))
      }

      const now = new Date()
      const endDate = new Date(now)
      endDate.setFullYear(endDate.getFullYear() + 1)

      const updated = await db.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          startDate: now,
          endDate,
          lastBilledAt: now,
        },
      })

      return ok(
        {
          success: true,
          message: 'Subscription reactivated successfully',
          subscription: {
            id: updated.id,
            status: updated.status,
          },
        },
        request.headers.get('origin')
      )
    }

    if (action === 'upgrade') {
      if (!planSlug) {
        return err('planSlug is required for upgrade', 400, request.headers.get('origin'))
      }

      const targetPlan = await db.subscriptionPlan.findUnique({
        where: { slug: planSlug },
      })

      if (!targetPlan) {
        return err(`Plan '${planSlug}' not found`, 404, request.headers.get('origin'))
      }

      const subscription = await db.tenantSubscription.findUnique({
        where: { tenantId: tenant.id },
      })

      if (!subscription) {
        return err('No subscription found', 404, request.headers.get('origin'))
      }

      // Check if same plan
      if (subscription.planId === targetPlan.id) {
        return err('Already on this plan', 400, request.headers.get('origin'))
      }

      const now = new Date()
      const endDate = new Date(now)
      endDate.setFullYear(endDate.getFullYear() + 1)

      const updated = await db.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          planId: targetPlan.id,
          status: 'active',
          startDate: now,
          endDate,
          lastBilledAt: now,
        },
        include: { plan: true },
      })

      return ok(
        {
          success: true,
          message: `Upgraded to ${targetPlan.name} successfully`,
          subscription: {
            id: updated.id,
            status: updated.status,
            planId: updated.planId,
          },
        },
        request.headers.get('origin')
      )
    }

    return err('Invalid action. Use: upgrade, cancel, or reactivate', 400, request.headers.get('origin'))
  } catch (error) {
    console.error('Subscription POST error:', error)
    return internalError(request.headers.get('origin'))
  }
}