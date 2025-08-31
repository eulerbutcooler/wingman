export interface TextChunk {
  text: string;
  index: number;
  tokenCount: number;
}

/**
 * Simple token counting (approximation: 1 token ≈ 4 characters)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  maxTokens: number = 700,
  overlapTokens: number = 100
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim() + '.';
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
    const tokenCount = estimateTokenCount(potentialChunk);
    
    if (tokenCount > maxTokens && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        tokenCount: estimateTokenCount(currentChunk)
      });
      
      // Start new chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = Math.floor(words.length * (overlapTokens / estimateTokenCount(currentChunk)));
      const overlap = words.slice(-overlapWords).join(' ');
      
      currentChunk = overlap + (overlap ? ' ' : '') + sentence;
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  // Add final chunk if it exists
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      tokenCount: estimateTokenCount(currentChunk)
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
    const chunkText = chunkWords.join(' ');
    
    chunks.push({
      text: chunkText,
      index: chunkIndex++,
      tokenCount: estimateTokenCount(chunkText)
    });
  }
  
  return chunks;
}
