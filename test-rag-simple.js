const { searchAllCourses } = require('./src/lib/rag/user-search.ts');

async function testRAG() {
  try {
    console.log('🧪 Testing global RAG search...');
    const results = await searchAllCourses("fundamental laws of thermodynamics", 3, 0.7);
    console.log('✅ Results:', results.length);
    console.log('📄 Sample result:', results[0]?.chunkText?.substring(0, 100));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRAG();
