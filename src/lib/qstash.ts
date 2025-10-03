import { Client } from "@upstash/qstash";

// Make QSTASH_TOKEN optional - only required if using background processing
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

/**
 * The QStash client for publishing messages to the queue.
 *
 * This client is configured once and can be reused throughout the application
 * to send jobs to the ingestion queue.
 *
 * Note: Will be null if QSTASH_TOKEN is not configured.
 */
export const qstashClient = QSTASH_TOKEN
  ? new Client({
      token: QSTASH_TOKEN,
    })
  : null;
