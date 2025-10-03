import { google } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';

// A simple utility function to pause execution.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate an embedding for a single text string.
 * This is suitable for low-volume tasks like embedding a user's search query.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.textEmbedding('text-embedding-004'),
      value: text,
    });
    
    return embedding;
  } catch (error) {
    console.error('Error generating single embedding:', error);
    throw new Error(`Failed to generate single embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * OPTIMIZED: Generate embeddings for multiple texts using true batching,
 * with a robust retry mechanism and exponential backoff to handle API rate limits.
 *
 * @param texts - An array of strings to be embedded.
 * @returns A promise that resolves to an array of embedding vectors.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];
  
  // The Gemini API documentation specifies a limit of 100 texts per batch.
  const batchSize = 100;
  const maxRetries = 5;
  const initialDelay = 1000; // 1 second

  for (let i = 0; i < texts.length; i += batchSize) {
    const batchTexts = texts.slice(i, i + batchSize);
    const attempts = 0;
    const delay = initialDelay;

    while (attempts < maxRetries) {
      try {
        console.log(`Embedding batch starting at index ${i}. Size: ${batchTexts.length}. Attempt: ${attempts + 1}`);
        
        // --- STRATEGY 1: TRUE BATCHING ---
        // We use `embedMany` to send the entire batch in a single API call.
        const { embeddings } = await embedMany({
          model: google.textEmbedding("text-embedding-004"),
          values: batchTexts,
        });

        allEmbeddings.push(...embeddings);
        console.log(`✅ Successfully embedded batch starting at index ${i}.`);
        break; // Success, exit the retry loop for this batch
      } catch (error) {
        attempts++;
        console.warn(`⚠️ Attempt ${attempts} failed for batch starting at index ${i}. Error:`, error);
        
        // --- STRATEGY 2: EXPONENTIAL BACKOFF & RETRY ---
        if (attempts >= maxRetries) {
          console.error(`❌ Failed to embed batch starting at index ${i} after ${maxRetries} attempts.`);
          throw new Error(
            `Failed to generate batch embeddings: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
        
        // Check if the error indicates a rate limit (common status code is 429)
        // This is a simplified check; a real implementation might inspect error codes.
        const isRateLimitError = error instanceof Error && error.message.includes('429');

        if (isRateLimitError) {
            console.log(`Rate limit detected. Waiting for ${delay}ms before retrying...`);
            await sleep(delay);
            delay *= 2; // Double the delay for the next potential attempt
        } else {
            // For other errors, wait a standard delay before retrying
            await sleep(delay);
        }
      }
    }
  }

  return allEmbeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
