export type JobHandler<T = unknown> = (payload: T) => Promise<void>

interface Job<T = unknown> {
  id: string
  type: string
  payload: T
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: number
  startedAt?: number
  completedAt?: number
  error?: string
  retries: number
  maxRetries: number
}

class QueueManager {
  private queues = new Map<string, Job[]>()
  private handlers = new Map<string, JobHandler>()
  private processing = new Set<string>()
  private concurrency = 3

  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler)
  }

  async enqueue<T>(type: string, payload: T, maxRetries = 3): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const job: Job<T> = {
      id,
      type,
      payload,
      status: 'pending',
      createdAt: Date.now(),
      retries: 0,
      maxRetries,
    }

    if (!this.queues.has(type)) {
      this.queues.set(type, [])
    }
    this.queues.get(type)!.push(job as Job)

    // Auto-process
    this.processQueue(type).catch(console.error)
    return id
  }

  private async processQueue(type: string): Promise<void> {
    if (this.processing.has(type)) return
    if (!this.queues.has(type)) return

    const queue = this.queues.get(type)!
    const handler = this.handlers.get(type)
    if (!handler) return

    this.processing.add(type)

    try {
      while (queue.length > 0) {
        const job = queue.find((j) => j.status === 'pending')
        if (!job) break

        job.status = 'processing'
        job.startedAt = Date.now()

        try {
          await handler(job.payload)
          job.status = 'completed'
          job.completedAt = Date.now()
        } catch (error) {
          job.retries++
          if (job.retries < job.maxRetries) {
            job.status = 'pending'
          } else {
            job.status = 'failed'
            job.error = error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    } finally {
      this.processing.delete(type)
      // Remove completed/failed jobs
      const filtered = queue.filter((j) => j.status === 'pending' || j.status === 'processing')
      this.queues.set(type, filtered)
    }
  }

  getJobStatus(type: string, id: string): Job | undefined {
    return this.queues.get(type)?.find((j) => j.id === id)
  }

  getQueueStats() {
    const stats: Record<string, { pending: number; processing: number; completed: number; failed: number }> = {}
    for (const [type, jobs] of this.queues.entries()) {
      stats[type] = {
        pending: jobs.filter((j) => j.status === 'pending').length,
        processing: jobs.filter((j) => j.status === 'processing').length,
        completed: jobs.filter((j) => j.status === 'completed').length,
        failed: jobs.filter((j) => j.status === 'failed').length,
      }
    }
    return stats
  }
}

export const queue = new QueueManager()

// Pre-registered job types
export const JOB_TYPES = {
  SEND_EMAIL: 'send_email',
  SEND_SMS: 'send_sms',
  PROCESS_PAYMENT: 'process_payment',
  GENERATE_REPORT: 'generate_report',
  SYNC_CALENDAR: 'sync_calendar',
  CLEANUP_EXPIRED: 'cleanup_expired',
  AUDIT_LOG: 'audit_log',
} as const

// Register default no-op handlers (to be replaced with real implementations)
queue.register(JOB_TYPES.SEND_EMAIL, async (payload: { to: string; subject: string; body: string }) => {
  console.log(`[Queue] Email to ${payload.to}: ${payload.subject}`)
})

queue.register(JOB_TYPES.SEND_SMS, async (payload: { to: string; message: string }) => {
  console.log(`[Queue] SMS to ${payload.to}: ${payload.message}`)
})

queue.register(JOB_TYPES.PROCESS_PAYMENT, async (payload: { bookingId: string; method: string }) => {
  console.log(`[Queue] Process payment for booking ${payload.bookingId} via ${payload.method}`)
})

queue.register(JOB_TYPES.GENERATE_REPORT, async (payload: { tenantId: string; type: string }) => {
  console.log(`[Queue] Generate ${payload.type} report for tenant ${payload.tenantId}`)
})

queue.register(JOB_TYPES.AUDIT_LOG, async (payload: { action: string; entity: string }) => {
  console.log(`[Queue] Audit: ${payload.action} on ${payload.entity}`)
})