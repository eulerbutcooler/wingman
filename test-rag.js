// Simple RAG test script without authentication
import fs from 'fs';
import path from 'path';

async function testPDFProcessing() {
  console.log('🧪 Testing RAG with Fundamentals of Thermodynamics.pdf...');
  
  try {
    // 1. Read PDF
    const pdfPath = path.join(process.cwd(), 'public', 'Fundamentals of Thermodynamics.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // 2. Extract text
    const { extractText } = await import('../src/lib/rag/text-extraction');
    const extractedText = await extractText(pdfBuffer, 'application/pdf');
    console.log(`📝 Extracted ${extractedText.text.length} characters`);
    console.log(`📖 Sample: ${extractedText.text.substring(0, 200)}...`);
    
    // 3. Chunk text
    const { chunkText } = await import('../src/lib/rag/text-chunking');
    const chunks = chunkText(extractedText.text);
    console.log(`📦 Created ${chunks.length} chunks`);
    
    // 4. Test embeddings (just first chunk)
    const { generateEmbedding } = await import('../src/lib/rag/embeddings');
    const embedding = await generateEmbedding(chunks[0].text);
    console.log(`🧠 Generated embedding: ${embedding.length} dimensions`);
    
    // 5. Test search similarity
    const queryEmbedding = await generateEmbedding("What is thermodynamics?");
    const { cosineSimilarity } = await import('../src/lib/rag/embeddings');
    const similarity = cosineSimilarity(embedding, queryEmbedding);
    console.log(`🎯 Similarity score: ${similarity.toFixed(4)}`);
    
    console.log('✅ RAG test completed successfully!');
    
  } catch (error) {
    console.error('❌ RAG test failed:', error);
  }
}

testPDFProcessing();
