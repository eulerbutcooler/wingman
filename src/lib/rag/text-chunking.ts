import { encoding_for_model } from 'tiktoken';

export interface TextChunk {
  text: string;
  index: number;
  tokenCount: number;
}

export interface PagedTextChunk {
  text: string;
  index: number;
  tokenCount: number;
  pageNumber: number;
  startPosition: number;
  endPosition: number;
}

// Cache the encoder to avoid recreating it
let cachedEncoder: ReturnType<typeof encoding_for_model> | null = null;

/**
 * Get the tiktoken encoder (cached)
 */
function getEncoder() {
  if (!cachedEncoder) {
    // Using cl100k_base which is compatible with GPT-4, GPT-3.5-turbo, and text-embedding models
    cachedEncoder = encoding_for_model('gpt-4');
  }
  return cachedEncoder;
}

/**
 * Accurate token counting using tiktoken
 * Compatible with OpenAI and Google embedding models
 */
export function estimateTokenCount(text: string): number {
  try {
    const encoder = getEncoder();
    const tokens = encoder.encode(text);
    return tokens.length;
  } catch (error) {
    // Fallback to approximation if tiktoken fails
    console.warn('Token counting error, using approximation:', error);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Free the encoder when done (call this when shutting down)
 */
export function freeEncoder() {
  if (cachedEncoder) {
    cachedEncoder.free();
    cachedEncoder = null;
  }
}

/**
 * Split text into chunks with overlap using semantic boundaries
 * Improved version that respects paragraphs and better handles overlap
 */
export function chunkText(
  text: string,
  maxTokens: number = 512,
  overlapTokens: number = 50
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  
  // Split by paragraphs first (better semantic boundaries)
  const paragraphs = text
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  let currentChunk = "";
  let chunkIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    const potentialChunk = currentChunk + (currentChunk ? "\n\n" : "") + paragraph;
    const tokenCount = estimateTokenCount(potentialChunk);

    if (tokenCount > maxTokens && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        tokenCount: estimateTokenCount(currentChunk),
      });

      // Create overlap: take last N tokens from current chunk
      const currentTokens = estimateTokenCount(currentChunk);
      if (currentTokens > overlapTokens) {
        const words = currentChunk.split(/\s+/);
        let overlapText = "";
        
        // Build overlap from end backwards
        for (let j = words.length - 1; j >= 0; j--) {
          const testOverlap = words.slice(j).join(" ");
          const testTokens = estimateTokenCount(testOverlap);
          
          if (testTokens <= overlapTokens) {
            overlapText = testOverlap;
          } else {
            break;
          }
        }
        
        currentChunk = overlapText + (overlapText ? "\n\n" : "") + paragraph;
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add final chunk if it exists
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      tokenCount: estimateTokenCount(currentChunk),
    });
  }

  return chunks;
}

/**
 * Alternative chunking method for very long documents
 */
export function chunkTextByWords(
  text: string,
  maxWords: number = 500,
  overlapWords: number = 50
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const words = text.split(/\s+/);
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < words.length; i += maxWords - overlapWords) {
    const chunkWords = words.slice(i, i + maxWords);
    const chunkText = chunkWords.join(" ");

    chunks.push({
      text: chunkText,
      index: chunkIndex++,
      tokenCount: estimateTokenCount(chunkText),
    });
  }

  return chunks;
}

/**
 * Chunk paged text while preserving page information
 * Improved with better overlap handling
 */
export function chunkPagedText(
  pagedText: Array<{
    pageNumber: number;
    text: string;
    startPosition: number;
    endPosition: number;
  }>,
  maxTokens: number = 512,
  overlapTokens: number = 50
): PagedTextChunk[] {
  const chunks: PagedTextChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pagedText) {
    if (!page.text || page.text.trim().length === 0) {
      continue;
    }

    // Split page text by paragraphs for better semantic boundaries
    const paragraphs = page.text
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0);

    let currentChunk = "";
    let chunkStartPosition = page.startPosition;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      const potentialChunk =
        currentChunk + (currentChunk ? "\n\n" : "") + paragraph;
      const tokenCount = estimateTokenCount(potentialChunk);

      if (tokenCount > maxTokens && currentChunk) {
        // Calculate positions within the page
        const chunkLength = currentChunk.length;
        const chunkEndPosition = chunkStartPosition + chunkLength;

        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          index: globalChunkIndex++,
          tokenCount: estimateTokenCount(currentChunk),
          pageNumber: page.pageNumber,
          startPosition: chunkStartPosition,
          endPosition: chunkEndPosition,
        });

        // Create overlap: take last N tokens
        const words = currentChunk.split(/\s+/);
        let overlapText = "";
        
        // Build overlap from end backwards
        for (let j = words.length - 1; j >= 0; j--) {
          const testOverlap = words.slice(j).join(" ");
          const testTokens = estimateTokenCount(testOverlap);
          
          if (testTokens <= overlapTokens) {
            overlapText = testOverlap;
          } else {
            break;
          }
        }

        currentChunk = overlapText + (overlapText ? "\n\n" : "") + paragraph;
        chunkStartPosition = chunkEndPosition - overlapText.length;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add the last chunk for this page
    if (currentChunk.trim()) {
      const chunkLength = currentChunk.length;
      const chunkEndPosition = Math.min(
        chunkStartPosition + chunkLength,
        page.endPosition
      );

      chunks.push({
        text: currentChunk.trim(),
        index: globalChunkIndex++,
        tokenCount: estimateTokenCount(currentChunk),
        pageNumber: page.pageNumber,
        startPosition: chunkStartPosition,
        endPosition: chunkEndPosition,
      });
    }
  }

  return chunks;
}
