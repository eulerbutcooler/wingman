// Quick test to verify tiktoken is working correctly
import { estimateTokenCount, chunkText } from './src/lib/rag/text-chunking.ts';

console.log('🧪 Testing Token Counting with tiktoken\n');

// Test 1: Simple text
const simpleText = "Hello world! This is a test.";
const tokens1 = estimateTokenCount(simpleText);
console.log(`Test 1 - Simple text:`);
console.log(`Text: "${simpleText}"`);
console.log(`Tokens: ${tokens1} (expected: ~7-8 tokens)`);
console.log(`Old method would give: ${Math.ceil(simpleText.length / 4)} tokens\n`);

// Test 2: Complex text with special characters
const complexText = "Dr. Smith's Ph.D. thesis (2024) discusses AI/ML algorithms.";
const tokens2 = estimateTokenCount(complexText);
console.log(`Test 2 - Complex text with abbreviations:`);
console.log(`Text: "${complexText}"`);
console.log(`Tokens: ${tokens2}`);
console.log(`Old method would give: ${Math.ceil(complexText.length / 4)} tokens\n`);

// Test 3: Chunking test
const longText = `
This is a paragraph about artificial intelligence.
AI has transformed how we interact with technology.

Machine learning is a subset of AI that focuses on learning from data.
Deep learning uses neural networks with multiple layers.

Natural language processing helps computers understand human language.
This includes tasks like translation, summarization, and question answering.
`;

console.log(`Test 3 - Chunking with accurate token counting:`);
const chunks = chunkText(longText, 50, 10); // Small chunks for testing
console.log(`Original text length: ${longText.length} characters`);
console.log(`Number of chunks: ${chunks.length}`);
chunks.forEach((chunk, idx) => {
  console.log(`\nChunk ${idx + 1}:`);
  console.log(`  Token count: ${chunk.tokenCount}`);
  console.log(`  Text preview: "${chunk.text.substring(0, 80)}..."`);
});

console.log('\n✅ Token counting test complete!');
console.log('💡 Chunks are now based on paragraphs (semantic boundaries) instead of sentences');
console.log('💡 Overlap is calculated based on actual token count, not word proportion');
