import { estimateTokenCount, PagedTextChunk } from "./text-chunking";

interface ChunkingOptions {
  maxTokens: number;
  overlapTokens: number;
  minTokens: number;
  separators: string[];
}

const defaultOptions: ChunkingOptions = {
  maxTokens: 700,
  overlapTokens: 100,
  minTokens: 50, // Chunks smaller than this will be merged
  // Hierarchical separators, from largest to smallest semantic unit
  separators: ["\n\n\n", "\n\n", "\n", ". ", " "],
};

/**
 * Recursively splits text into chunks based on a hierarchy of separators.
 * This method is more robust than simple sentence splitting as it tries to
 * respect larger semantic boundaries (like paragraphs) first.
 *
 * @param text The input text to be chunked.
 * @param options The chunking configuration.
 * @returns An array of text chunks.
 */
function recursiveSplit(text: string, options: ChunkingOptions): string[] {
  const { separators, maxTokens } = options;
  const finalChunks: string[] = [];

  // Use the first separator in the hierarchy
  const separator = separators[0];
  const remainingSeparators = separators.slice(1);

  // Split the text by the current separator
  const splits = text.split(separator);

  let currentChunk = "";
  for (const split of splits) {
    if (!split.trim()) continue;

    const potentialChunk = currentChunk
      ? currentChunk + separator + split
      : split;
    const tokenCount = estimateTokenCount(potentialChunk);

    if (tokenCount > maxTokens) {
      // If the current chunk is not empty, process it first
      if (currentChunk) {
        // If the chunk is still too big, recurse with the next separators
        if (remainingSeparators.length > 0) {
          finalChunks.push(
            ...recursiveSplit(currentChunk, {
              ...options,
              separators: remainingSeparators,
            })
          );
        } else {
          // If no more separators, forcefully split the chunk
          finalChunks.push(forceSplit(currentChunk, options));
        }
      }
      // Start a new chunk with the current split
      currentChunk = split;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add the last remaining chunk
  if (currentChunk) {
    if (
      estimateTokenCount(currentChunk) > maxTokens &&
      remainingSeparators.length > 0
    ) {
      finalChunks.push(
        ...recursiveSplit(currentChunk, {
          ...options,
          separators: remainingSeparators,
        })
      );
    } else {
      finalChunks.push(currentChunk);
    }
  }

  // Merge small chunks to avoid overly fragmented data
  return mergeSmallChunks(finalChunks, options);
}

/**
 * Forcefully splits a chunk that exceeds maxTokens even after recursive splitting.
 */
function forceSplit(text: string, options: ChunkingOptions): string {
  // A simple character-based split as a last resort
  return text.substring(0, options.maxTokens * 4); // Approx. char count
}

/**
 * Merges chunks that are smaller than the specified minimum token count.
 */
function mergeSmallChunks(
  chunks: string[],
  options: ChunkingOptions
): string[] {
  if (chunks.length <= 1) return chunks;

  const mergedChunks: string[] = [];
  let buffer = chunks[0];

  for (let i = 1; i < chunks.length; i++) {
    const currentChunk = chunks[i];
    if (estimateTokenCount(buffer) < options.minTokens) {
      buffer += " " + currentChunk; // A space is a reasonable default joiner
    } else {
      mergedChunks.push(buffer);
      buffer = currentChunk;
    }
  }
  mergedChunks.push(buffer);

  return mergedChunks;
}

/**
 * Creates overlapping chunks from a list of text segments.
 */
function createOverlaps(
  chunks: string[],
  options: ChunkingOptions
): string[] {
  if (chunks.length <= 1) return chunks;

  const overlappingChunks: string[] = [chunks[0]];

  for (let i = 1; i < chunks.length; i++) {
    const prevChunk = chunks[i - 1];
    const currentChunk = chunks[i];

    const prevWords = prevChunk.split(/\s+/);
    const overlapWordCount = Math.floor(
      prevWords.length *
        (options.overlapTokens / estimateTokenCount(prevChunk))
    );

    if (overlapWordCount > 0) {
      const overlap = prevWords.slice(-overlapWordCount).join(" ");
      overlappingChunks.push(overlap + " " + currentChunk);
    } else {
      overlappingChunks.push(currentChunk);
    }
  }

  return overlappingChunks;
}

/**
 * The main function to chunk text using the recursive strategy.
 * It combines splitting, merging, and overlapping into a single pipeline.
 *
 * @param text The text to be chunked.
 * @param customOptions Optional custom chunking parameters.
 * @returns An array of structured PagedTextChunk objects.
 */
export function chunkTextWithStrategy(
  text: string,
  pageNumber: number = 1,
  startPosition: number = 0,
  customOptions: Partial<ChunkingOptions> = {}
): Omit<PagedTextChunk, "index">[] {
  const options = { ...defaultOptions, ...customOptions };

  const initialChunks = recursiveSplit(text, options);
  const overlappedChunks = createOverlaps(initialChunks, options);

  let currentPosition = startPosition;

  return overlappedChunks.map((chunkText) => {
    const tokenCount = estimateTokenCount(chunkText);
    const chunkLength = chunkText.length;
    const endPosition = currentPosition + chunkLength;

    const chunkData = {
      text: chunkText,
      tokenCount,
      pageNumber,
      startPosition: currentPosition,
      endPosition,
    };

    currentPosition = endPosition + 1; // Account for separator space
    return chunkData;
  });
}
