// ═══════════════════════════════════════════════════════════════════
// Background Job Queue System
// ═══════════════════════════════════════════════════════════════════

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying'

export interface Job<T = unknown> {
  id: string
  type: string
  payload: T
  status: JobStatus
  priority: number       // Lower = higher priority
  attempts: number
  maxAttempts: number
  delay: number          // ms before next retry
  createdAt: number
  startedAt?: number
  completedAt?: number
  error?: string
  result?: unknown
}

export type JobHandler<T = unknown> = (payload: T, job: Job<T>) => Promise<unknown>

interface QueueConfig {
  concurrency: number
  retryDelay: number
  maxRetries: number
  maxQueueSize: number
}

const DEFAULT_CONFIG: QueueConfig = {
  concurrency: 5,
  retryDelay: 5000,
  maxRetries: 3,
  maxQueueSize: 10000,
}

class Queue {
  private queues = new Map<string, Job[]>()
  private handlers = new Map<string, JobHandler>()
  private processing = new Map<string, number>()
  private config: QueueConfig

  constructor(config?: Partial<QueueConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // Register a job handler
  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler)
  }

  // Enqueue a new job
  enqueue<T>(type: string, payload: T, options?: { priority?: number; delay?: number; maxRetries?: number }): string {
    const id = `job_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

    if (!this.queues.has(type)) {
      this.queues.set(type, [])
    }

    const queue = this.queues.get(type)!

    // Check queue size
    if (queue.length >= this.config.maxQueueSize) {
      throw new Error(`Queue "${type}" is full`)
    }

    const job: Job<T> = {
      id,
      type,
      payload,
      status: 'pending',
      priority: options?.priority ?? 5,
      attempts: 0,
      maxAttempts: options?.maxRetries ?? this.config.maxRetries,
      delay: options?.delay ?? this.config.retryDelay,
      createdAt: Date.now(),
    }

    // Insert by priority
    const insertIndex = queue.findIndex(j => j.priority > job.priority)
    if (insertIndex === -1) {
      queue.push(job as Job)
    } else {
      queue.splice(insertIndex, 0, job as Job)
    }

    // Auto-process
    this.processQueue(type)
    return id
  }

  private async processQueue(type: string): Promise<void> {
    const handler = this.handlers.get(type)
    if (!handler) return

    const queue = this.queues.get(type)
    if (!queue || queue.length === 0) return

    const currentProcessing = this.processing.get(type) || 0
    if (currentProcessing >= this.config.concurrency) return

    const job = queue.find(j => j.status === 'pending')
    if (!job) return

    this.processing.set(type, currentProcessing + 1)
    job.status = 'processing'
    job.startedAt = Date.now()

    try {
      const result = await handler(job.payload, job)
      job.status = 'completed'
      job.result = result
      job.completedAt = Date.now()
    } catch (error) {
      job.attempts++
      if (job.attempts < job.maxAttempts) {
        job.status = 'retrying'
        // Re-queue with delay
        setTimeout(() => {
          job.status = 'pending'
          this.processQueue(type)
        }, job.delay * job.attempts)
      } else {
        job.status = 'failed'
        job.error = error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      this.processing.set(type, (this.processing.get(type) || 1) - 1)
      // Remove completed/failed jobs
      if (job.status === 'completed' || job.status === 'failed') {
        const idx = queue.indexOf(job)
        if (idx >= 0) queue.splice(idx, 1)
      }
      // Process next
      if (queue.length > 0) {
        this.processQueue(type)
      }
    }
  }

  // Get job status
  getJobStatus(type: string, jobId: string): Job | undefined {
    const queue = this.queues.get(type)
    return queue?.find(j => j.id === jobId)
  }

  // Get queue stats
  getStats(type: string): { pending: number; processing: number; total: number } {
    const queue = this.queues.get(type) || []
    return {
      pending: queue.filter(j => j.status === 'pending' || j.status === 'retrying').length,
      processing: queue.filter(j => j.status === 'processing').length,
      total: queue.length,
    }
  }
}

// Singleton queue instance
export const queue = new Queue()

// ─── Predefined Job Types ────────────────────────────────────────
export const JOB_TYPES = {
  // Email notifications
  EMAIL_BOOKING_CONFIRMATION: 'email.booking.confirmation',
  EMAIL_BOOKING_REMINDER: 'email.booking.reminder',
  EMAIL_BOOKING_CANCELLATION: 'email.booking.cancellation',
  EMAIL_WELCOME: 'email.welcome',
  EMAIL_PASSWORD_RESET: 'email.password_reset',
  EMAIL_RECEIPT: 'email.receipt',

  // Background processing
  EXPORT_DATA: 'export.data',
  IMPORT_DATA: 'import.data',
  GENERATE_REPORT: 'report.generate',
  PROCESS_PAYMENT_WEBHOOK: 'payment.webhook',
  SYNC_CALENDAR: 'calendar.sync',
  CLEANUP_EXPIRED: 'cleanup.expired',

  // Real-time
  PUSH_NOTIFICATION: 'push.notification',
  WEBSOCKET_BROADCAST: 'ws.broadcast',
} as const