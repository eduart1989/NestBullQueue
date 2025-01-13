export const GENERATE_PDF = 'generate-pdf-queue';
export const SEND_EMAIL = 'send-email-queue';

export const PROCESS_CONCURRENCY = 70;
export const DEFAULT_QUEUE_OPTIONS = {
  attempts: 3,
  removeOnComplete: true,
  backoff: {
    type: 'exponential',
    delay: 6000,
  },
};

export const GENERATE_PDF_QUEUE_OPTIONS = {
  attempts: 3,
  removeOnComplete: true,
  backoff: {
    type: 'exponential',
    delay: 6000,
  },
};

export const BULL_CONFIG_SETTINGS = {
  lockDuration: 30000, // 30 seconds lock per job
  maxStalledCount: 3,
  concurrency: 300, // Global concurrency setting
};
