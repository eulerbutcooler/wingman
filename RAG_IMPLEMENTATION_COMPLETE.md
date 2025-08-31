# RAG Pipeline Implementation Complete! 🎉

## Overview

I've successfully implemented a complete RAG (Retrieval-Augmented Generation) pipeline in your Next.js project. Here's what's been built:

## 🏗️ Architecture

### 1. **Document Processing Pipeline**
- **Text Extraction**: PDF, DOCX, PPTX support using `pdf-parse` and `mammoth`
- **Text Chunking**: Smart chunking with overlap (500-800 tokens per chunk)
- **Embedding Generation**: Gemini embeddings via Vercel AI SDK
- **Vector Storage**: pgvector in Supabase Postgres

### 2. **Database Schema**
```sql
-- New table for storing document chunks and embeddings
document_chunks (
  id UUID PRIMARY KEY,
  course_id UUID,
  file_id UUID,
  chunk_text TEXT,
  chunk_index INTEGER,
  token_count INTEGER,
  embedding vector(768), -- Gemini embeddings
  created_at TIMESTAMP
)

-- Extended files table
files (
  -- existing columns...
  processing_status TEXT, -- 'pending', 'processing', 'completed', 'failed'
  processing_error TEXT,
  chunk_count INTEGER
)
```

### 3. **API Endpoints**

#### Document Processing
- `POST /api/process-documents` - Process uploaded documents
- `GET /api/process-documents?fileId=...` - Check processing status

#### RAG Chat
- `POST /api/chat/rag` - Ask questions with RAG
- `GET /api/chat/rag?courseId=...` - Get course index stats

## 🔄 How It Works

### Automatic Processing Flow
1. **Upload**: User uploads PDF/DOCX/PPTX via existing upload system
2. **Trigger**: Upload endpoint automatically triggers document processing
3. **Extract**: Text is extracted from the document
4. **Chunk**: Text is split into overlapping chunks
5. **Embed**: Each chunk gets a Gemini embedding
6. **Store**: Chunks and embeddings are stored in `document_chunks` table

### Chat Flow
1. **Query**: User asks a question about course materials
2. **Search**: Query is embedded and similar chunks are found using vector search
3. **Context**: Top-k relevant chunks are gathered as context
4. **Generate**: Gemini generates answer using context
5. **Respond**: Answer is returned with source citations

## 🛠️ Setup Required

### 1. Database Setup
Run this SQL in your Supabase SQL editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    token_count INTEGER,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_course_id ON document_chunks(course_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_id ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Add processing columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE files ADD COLUMN IF NOT EXISTS processing_error TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
```

### 2. Environment Variables
Ensure you have:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Testing

### 1. Test Page
Visit `/rag-test` to test the RAG system:
- Enter a course ID
- Check indexing status
- Ask questions about uploaded materials

### 2. Example Usage

#### Upload a document:
```bash
curl -X POST http://localhost:3000/api/upload-supabase \
  -F "file=@document.pdf" \
  -F "userId=user123" \
  -F "topicId=topic456"
```

#### Check processing status:
```bash
curl "http://localhost:3000/api/process-documents?fileId=file123"
```

#### Ask a question:
```bash
curl -X POST http://localhost:3000/api/chat/rag \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the main topic of this course?",
    "courseId": "course123"
  }'
```

## 📁 File Structure

```
src/
├── lib/rag/
│   ├── text-extraction.ts    # PDF/DOCX/PPTX text extraction
│   ├── text-chunking.ts      # Smart text chunking
│   ├── embeddings.ts         # Gemini embedding generation
│   ├── document-processor.ts # Main processing pipeline
│   └── search.ts            # Vector similarity search
├── app/api/
│   ├── process-documents/    # Document processing endpoint
│   ├── chat/rag/            # RAG chat endpoint
│   └── upload-supabase/     # Enhanced with auto-processing
└── app/rag-test/            # Test interface
```

## 🎯 Key Features

✅ **Automatic Processing**: Documents are processed immediately after upload
✅ **Multi-format Support**: PDF, DOCX, PPTX files
✅ **Smart Chunking**: Overlapping chunks for better context
✅ **Vector Search**: Fast similarity search with pgvector
✅ **Source Citations**: AI responses include source references
✅ **Error Handling**: Robust error handling and status tracking
✅ **Edge-friendly**: Uses Vercel AI SDK and edge-compatible code

## 🚀 Performance Optimizations

- **Batch Processing**: Embeddings are generated in batches
- **Indexed Search**: Vector similarity search is optimized with indexes
- **Async Processing**: Document processing doesn't block uploads
- **Smart Chunking**: Preserves sentence boundaries
- **Similarity Threshold**: Only relevant chunks are used

## 🔧 Customization Options

### Chunking Parameters
```typescript
// In text-chunking.ts
chunkText(text, maxTokens = 700, overlapTokens = 100)
```

### Search Parameters
```typescript
// In search.ts
searchSimilarChunks(query, courseId, topK = 5, similarityThreshold = 0.3)
```

### Embedding Model
```typescript
// In embeddings.ts - can switch to different Gemini models
google.textEmbedding('text-embedding-004')
```

## 🐛 Troubleshooting

1. **pgvector extension not found**: Run the SQL setup in Supabase
2. **Processing stuck**: Check the `files` table `processing_status` column
3. **No results found**: Ensure documents are processed and have `completed` status
4. **Embedding errors**: Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set correctly

## 📊 Monitoring

Check processing status:
```sql
SELECT 
  original_name,
  processing_status,
  chunk_count,
  processing_error
FROM files 
WHERE processing_status != 'completed';
```

Check indexing stats:
```sql
SELECT 
  course_id,
  COUNT(DISTINCT file_id) as files,
  COUNT(*) as chunks,
  AVG(token_count) as avg_tokens
FROM document_chunks 
GROUP BY course_id;
```

Your RAG pipeline is now fully operational! 🎉
