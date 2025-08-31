import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing RAG with Fundamentals of Thermodynamics.pdf...');
    
    // 1. Read the PDF file from public folder
    const pdfPath = path.join(process.cwd(), 'public', 'Fundamentals of Thermodynamics.pdf');
    console.log('📄 Reading PDF from:', pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file not found in public folder');
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${pdfBuffer.length} bytes`);
    
    // 2. Extract text
    console.log('🔍 Extracting text from PDF...');
    const { extractText } = await import('@/lib/rag/text-extraction');
    const extractedText = await extractText(pdfBuffer, 'application/pdf');
    console.log(`📝 Extracted ${extractedText.text.length} characters, ${extractedText.metadata?.pageCount} pages`);
    
    // Show sample text
    const sample = extractedText.text.substring(0, 200);
    console.log('📖 Sample text:', sample + '...');
    
    // 3. Chunk the text
    console.log('✂️ Chunking text...');
    const { chunkText } = await import('@/lib/rag/text-chunking');
    const chunks = chunkText(extractedText.text);
    console.log(`📦 Created ${chunks.length} chunks`);
    
    // Show sample chunk
    if (chunks.length > 0) {
      console.log('📝 Sample chunk:', chunks[0].text.substring(0, 150) + '...');
    }
    
    // 4. Generate embeddings for first 2 chunks (to save time/cost)
    console.log('🧠 Generating embeddings for first 2 chunks...');
    const testChunks = chunks.slice(0, 2);
    const { generateEmbeddings } = await import('@/lib/rag/embeddings');
    const chunkTexts = testChunks.map(chunk => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`🎯 Generated ${embeddings.length} embeddings, each with ${embeddings[0]?.length} dimensions`);
    
    // 5. Test search functionality
    console.log('🔍 Testing search with sample query...');
    const testQuery = "What is thermodynamics?";
    const { generateEmbedding } = await import('@/lib/rag/embeddings');
    const queryEmbedding = await generateEmbedding(testQuery);
    console.log(`❓ Query embedding generated: ${queryEmbedding.length} dimensions`);
    
    // Calculate similarities
    const { cosineSimilarity } = await import('@/lib/rag/embeddings');
    const similarities = embeddings.map((embedding, index) => ({
      chunkIndex: index,
      similarity: cosineSimilarity(queryEmbedding, embedding),
      text: testChunks[index].text.substring(0, 100) + '...'
    }));
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    console.log('🏆 Top similar chunks:');
    similarities.forEach((sim, index) => {
      console.log(`${index + 1}. Similarity: ${sim.similarity.toFixed(4)} - ${sim.text}`);
    });
    
    return NextResponse.json({
      success: true,
      message: 'RAG test completed successfully!',
      results: {
        textLength: extractedText.text.length,
        pageCount: extractedText.metadata?.pageCount,
        chunkCount: chunks.length,
        embeddingDimensions: embeddings[0]?.length,
        testSimilarities: similarities,
        sampleText: sample
      }
    });
    
  } catch (error) {
    console.error('❌ RAG test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
