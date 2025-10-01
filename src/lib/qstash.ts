import { Client } from "@upstash/qstash";

if (!process.env.QSTASH_TOKEN) {
  throw new Error("Missing QSTASH_TOKEN environment variable");
}

/**
 * The QStash client for publishing messages to the queue.
 *
 * This client is configured once and can be reused throughout the application
 * to send jobs to the ingestion queue.
 */
export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});
