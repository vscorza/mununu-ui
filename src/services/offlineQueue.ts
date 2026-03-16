/**
 * Offline Queue Service
 * Manages queued operations when the app is offline
 */

export interface QueuedOperation {
  id: string
  type: 'api' | 'action'
  endpoint?: string
  method?: string
  payload?: unknown
  timestamp: number
  retries: number
  maxRetries?: number
}

const QUEUE_STORAGE_KEY = 'holiday_offline_queue'
const MAX_QUEUE_SIZE = 100

class OfflineQueueService {
  private queue: QueuedOperation[] = []
  private listeners: Set<(queue: QueuedOperation[]) => void> = new Set()

  constructor() {
    this.loadQueue()
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error)
      this.queue = []
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue))
      this.notifyListeners()
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error)
    }
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.queue]))
  }

  /**
   * Add an operation to the queue
   */
  enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const queuedOperation: QueuedOperation = {
      id,
      timestamp: Date.now(),
      retries: 0,
      ...operation,
    }

    // Prevent queue from growing too large
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest operations
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE + 1)
    }

    this.queue.push(queuedOperation)
    this.saveQueue()

    console.log('[OfflineQueue] Enqueued operation:', id, operation.type)
    return id
  }

  /**
   * Remove an operation from the queue
   */
  dequeue(id: string): boolean {
    const index = this.queue.findIndex(op => op.id === id)
    if (index !== -1) {
      this.queue.splice(index, 1)
      this.saveQueue()
      return true
    }
    return false
  }

  /**
   * Get all queued operations
   */
  getAll(): QueuedOperation[] {
    return [...this.queue]
  }

  /**
   * Get operations by type
   */
  getByType(type: QueuedOperation['type']): QueuedOperation[] {
    return this.queue.filter(op => op.type === type)
  }

  /**
   * Clear all operations from the queue
   */
  clear(): void {
    this.queue = []
    this.saveQueue()
  }

  /**
   * Increment retry count for an operation
   */
  incrementRetry(id: string): boolean {
    const operation = this.queue.find(op => op.id === id)
    if (operation) {
      operation.retries++
      this.saveQueue()
      return true
    }
    return false
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedOperation[]) => void): () => void {
    this.listeners.add(listener)
    // Immediately notify with current queue
    listener([...this.queue])

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length
  }
}

export const offlineQueue = new OfflineQueueService()
