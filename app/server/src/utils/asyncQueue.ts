type Job<T> = () => Promise<T>;

interface QueueItem<T> {
  job: Job<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export class AsyncQueue {
  private running = 0;
  private queue: QueueItem<any>[] = [];

  constructor(private concurrency: number) {
    if (concurrency < 1) throw new Error('Concurrency must be at least 1');
  }

  enqueue<T>(job: Job<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ job, resolve, reject });
      this.processNext();
    });
  }

  private processNext() {
    if (this.running >= this.concurrency) return;
    const item = this.queue.shift();
    if (!item) return;
    this.running += 1;
    Promise.resolve()
      .then(() => item.job())
      .then(result => item.resolve(result))
      .catch(err => item.reject(err))
      .finally(() => {
        this.running -= 1;
        this.processNext();
      });
  }
}

const ocrQueue = new AsyncQueue(Number(process.env.OCR_CONCURRENCY || 1));

export function enqueueOCR<T>(job: Job<T>): Promise<T> {
  return ocrQueue.enqueue(job);
}
