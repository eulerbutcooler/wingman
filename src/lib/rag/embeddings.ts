import { google } from '@ai-sdk/google';
import { embed } from 'ai';

/**
 * Generate embeddings using Gemini's text-embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.textEmbedding('text-embedding-004'),
      value: text,
    });
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch with optimized batch size
 * Increased from 10 to 50 for 5x faster processing
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings: number[][] = [];
    
    // Optimized batch size: Google API supports up to 100, using 50 for safety
    const batchSize = 50;
    const maxRetries = 3;
    const delayBetweenBatches = 100; // 100ms delay to respect rate limits
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      let retryCount = 0;
      let batchEmbeddings: number[][] | null = null;
      
      // Retry logic with exponential backoff for rate limits
      while (retryCount < maxRetries && !batchEmbeddings) {
        try {
          const batchPromises = batch.map(text => generateEmbedding(text));
          batchEmbeddings = await Promise.all(batchPromises);
          embeddings.push(...batchEmbeddings);
          
          console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} items)`);
          
          // Small delay between batches to respect rate limits
          if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        } catch (error) {
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const waitTime = Math.pow(2, retryCount - 1) * 1000;
            console.warn(`⚠️ Batch failed, retrying in ${waitTime}ms (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        }
      }
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
