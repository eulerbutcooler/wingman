# Complete File Upload and RAG Pipeline - Deep Dive

This document provides a comprehensive walkthrough of the entire file upload and RAG (Retrieval-Augmented Generation) pipeline in Wingman, from the moment a user selects a file to when that content is used to answer their questions.

## Table of Contents
1. [Overview](#overview)
2. [Phase 1: File Upload](#phase-1-file-upload)
3. [Phase 2: Document Processing](#phase-2-document-processing)
4. [Phase 3: RAG Indexing](#phase-3-rag-indexing)
5. [Phase 4: Query & Retrieval](#phase-4-query--retrieval)
6. [Phase 5: Response Generation](#phase-5-response-generation)
7. [Complete Flow Diagram](#complete-flow-diagram)
8. [Error Handling](#error-handling)
9. [Performance Considerations](#performance-considerations)

---

## Overview

The Wingman RAG system transforms uploaded documents into searchable, semantic knowledge that can be retrieved and used to generate contextual responses. The pipeline consists of 5 main phases:

```
User Uploads File → File Storage → Text Extraction → Chunking → 
Embedding Generation → Vector Storage → Query Processing → Context Retrieval → 
AI Response with Citations
```

---

## Phase 1: File Upload

### 1.1 User Interaction (Frontend)

**File:** `src/components/CourseCreator.tsx`

When a user creates a course and adds lessons with files:

```typescript
const handleFileSelect = (topicId: string, lessonId: string, file: File) => {
  console.log("📎 File selected:", file.name);
  
  // Validate file type and size
  const validation = courseService.validateFile(file);
  if (!validation.isValid) {
    alert(validation.error);
    return;
  }
  
  // Update lesson state with file
  updateLesson(topicId, lessonId, {
    file,
    type: validation.fileType, // 'pdf' | 'docx' | 'pptx'
    uploading: false,
  });
}
```

### 1.2 File Validation

**File:** `src/services/course-service.ts`

Before upload, files are validated:

```typescript
export function validateFile(file: File): FileValidationResult {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const pdfTypes = ["application/pdf"];
  const docxTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const pptxTypes = [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  // Size check
  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 100MB" };
  }

  // Type check
  if (pdfTypes.includes(file.type)) return { isValid: true, fileType: "pdf" };
  if (docxTypes.includes(file.type)) return { isValid: true, fileType: "docx" };
  if (pptxTypes.includes(file.type)) return { isValid: true, fileType: "pptx" };

  return { isValid: false, error: "Only PDF, DOCX, and PPTX supported" };
}
```

### 1.3 Course and Lesson Creation

When the user submits the course form:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // 1. Create course structure
  const courseData = {
    title: formData.title,
    description: formData.description,
    imageUrl: formData.imageUrl,
    userId,
    topics: topics.map((topic) => ({
      title: topic.title,
      lessons: topic.lessons.map((lesson) => ({
        title: lesson.title,
        type: lesson.type,
      })),
    })),
  };

  // 2. Create course in database
  const createdCourse = await courseService.createCourse(courseData);
  
  // 3. Upload files for each lesson
  for (const topic of topics) {
    for (const lesson of topic.lessons) {
      if (lesson.file) {
        // Find the corresponding lesson in created course
        const createdTopic = createdCourse.topics?.find(
          (t) => t.title === topic.title
        );
        const createdLesson = createdTopic?.lessons?.find(
          (l) => l.title === lesson.title
        );

        // Upload file and link to lesson
        const uploadedFile = await courseService.uploadFile(
          lesson.file,
          userId,
          createdLesson.id.toString(),
          createdTopic.id.toString(),
          (progress) => {
            updateLesson(topic.id, lesson.id, { uploadProgress: progress });
          }
        );
      }
    }
  }
}
```

### 1.4 File Upload to Supabase Storage

**File:** `src/services/course-service.ts`

```typescript
export async function uploadFile(
  file: File,
  userId?: string,
  lessonId?: string,
  topicId?: string,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append("file", file);
  if (lessonId) formData.append("lessonId", lessonId);
  if (topicId) formData.append("topicId", topicId);

  // Upload via API route
  const response = await fetch(`/api/upload`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result.file;
}
```

### 1.5 Server-Side Upload Handler

**File:** `src/app/api/upload/route.ts`

This is where the magic begins:

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract file from form data
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const lessonId = formData.get("lessonId") as string;

  // 3. Validate file
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  // 4. Create Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5. Generate unique filename
  const timestamp = Date.now();
  const userId = user.id;
  const extension = file.name.split(".").pop();
  const fileName = `${file.name.split(".")[0]}_${userId}_${timestamp}.${extension}`;
  const filePath = `documents/${fileName}`;

  // 6. Upload to Supabase Storage bucket 'course_material'
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("course_material")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // 7. Get public URL for the file
  const { data: publicUrlData } = supabase.storage
    .from("course_material")
    .getPublicUrl(filePath);

  // 8. Save file metadata to database
  const savedFile = await saveFileRecord({
    lessonId: lessonId || undefined,
    originalName: file.name,
    filename: fileName,
    mimeType: file.type,
    size: file.size,
    publicUrl: publicUrlData.publicUrl,
  });

  // 9. 🔥 TRIGGER RAG PROCESSING (asynchronously)
  console.log(`🚀 Triggering RAG processing for file: ${savedFile.id}`);
  
  processDocument(savedFile.id)
    .then((result) => {
      console.log(`✅ RAG processing completed:`, result);
    })
    .catch((error) => {
      console.error(`❌ RAG processing failed:`, error);
    });

  // 10. Return immediately (don't wait for processing)
  return NextResponse.json({
    success: true,
    file: savedFile,
    message: "File uploaded successfully, processing started",
  });
}
```

### 1.6 Save File Record to Database

**File:** `src/lib/actions/files/file-actions.ts`

```typescript
export async function saveFileRecord(
  data: SaveFileRecordData
): Promise<FileRecord> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // Insert into 'files' table
  const [savedFile] = await db
    .insert(files)
    .values({
      userId: user.id,
      originalName: data.originalName,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
      publicUrl: data.publicUrl,
      processingStatus: "pending", // Will be updated during RAG processing
      createdAt: new Date(),
    })
    .returning();

  // Link file to lesson if lessonId provided
  if (data.lessonId) {
    await db
      .update(lessons)
      .set({ fileId: savedFile.id })
      .where(eq(lessons.id, data.lessonId));
    
    console.log(`✅ Linked file ${savedFile.id} to lesson ${data.lessonId}`);
  }

  return {
    id: savedFile.id, // UUID
    fileName: savedFile.originalName,
    fileUrl: savedFile.publicUrl,
    fileType: savedFile.mimeType,
    fileSize: savedFile.size,
    processingStatus: savedFile.processingStatus || "pending",
    createdAt: savedFile.createdAt!,
  };
}
```

**Key Database Schema:**

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  processing_status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  processing_error TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 2: Document Processing

The RAG processing happens asynchronously after file upload. This is the core transformation phase.

### 2.1 Process Document Entry Point

**File:** `src/lib/rag/document-processor.ts`

```typescript
export async function processDocument(
  fileId: string
): Promise<ProcessingResult> {
  try {
    console.log(`🔄 Starting document processing for file ${fileId}`);

    // 1. Get file info from database
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      throw new Error("File not found in database");
    }

    // 2. Update status to 'processing'
    await db
      .update(files)
      .set({
        processingStatus: "processing",
        processingError: null,
      })
      .where(eq(files.id, fileId));

    // 3. Download file from Supabase Storage
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const storagePath = getStoragePath(fileRecord.publicUrl);
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("course_material")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError}`);
    }

    // 4. Convert to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());
    console.log(`📥 Downloaded file, size: ${buffer.length} bytes`);

    // 5. Extract text based on file type
    let chunks;
    
    if (fileRecord.mimeType === "application/pdf") {
      // PDF: Use page-aware extraction
      const { extractPagedTextFromPdf } = await import("./text-extraction");
      const { chunkPagedText } = await import("./text-chunking");

      const pagedText = await extractPagedTextFromPdf(buffer);
      console.log(`📝 Extracted: ${pagedText.pages.length} pages`);

      if (!pagedText.fullText || pagedText.fullText.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }

      // Chunk with page information preserved
      chunks = chunkPagedText(pagedText.pages);
      console.log(`🔪 Created ${chunks.length} chunks with page info`);
    } else {
      // DOCX/PPTX: Regular extraction
      const extractedText = await extractText(buffer, fileRecord.mimeType);
      console.log(`📝 Extracted text: ${extractedText.text.length} chars`);

      if (!extractedText.text || extractedText.text.trim().length === 0) {
        throw new Error("No text content found");
      }

      // Chunk without page info
      const regularChunks = chunkText(extractedText.text);
      
      // Convert to PagedTextChunk format
      chunks = regularChunks.map((chunk) => ({
        ...chunk,
        pageNumber: 1,
        startPosition: 0,
        endPosition: chunk.text.length,
      }));
    }

    if (chunks.length === 0) {
      throw new Error("No text chunks created");
    }

    // 6. Generate embeddings for all chunks
    const chunkTexts = chunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`🧠 Generated ${embeddings.length} embeddings`);

    // 7. Get course ID (from lesson -> topic -> course)
    const { lessons, topics } = await import("@/services/db/schema/courses");
    
    const [lessonRecord] = await db
      .select({ topicId: lessons.topicId })
      .from(lessons)
      .where(eq(lessons.fileId, fileRecord.id))
      .limit(1);

    if (!lessonRecord) {
      throw new Error("Could not find lesson for file");
    }

    const [topicRecord] = await db
      .select({ courseId: topics.courseId })
      .from(topics)
      .where(eq(topics.id, lessonRecord.topicId))
      .limit(1);

    if (!topicRecord) {
      throw new Error("Could not determine course ID");
    }

    const courseId = topicRecord.courseId;

    // 8. Store chunks and embeddings in database
    const chunkRecords = chunks.map((chunk, index) => ({
      courseId: courseId,
      fileId: fileRecord.id,
      chunkText: chunk.text,
      chunkIndex: chunk.index,
      tokenCount: chunk.tokenCount,
      pageNumber: chunk.pageNumber || null,
      startPosition: chunk.startPosition || null,
      endPosition: chunk.endPosition || null,
      embedding: embeddings[index], // 768-dimensional vector
    }));

    await db.insert(documentChunks).values(chunkRecords);
    console.log(`💾 Stored ${chunkRecords.length} chunks in database`);

    // 9. Update file status to 'completed'
    await db
      .update(files)
      .set({
        processingStatus: "completed",
        chunkCount: chunks.length,
        processingError: null,
      })
      .where(eq(files.id, fileId));

    console.log(`✅ Document processing completed for file ${fileId}`);

    return {
      success: true,
      fileId,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error(`❌ Error processing document ${fileId}:`, error);

    // Update file status to 'failed'
    await db
      .update(files)
      .set({
        processingStatus: "failed",
        processingError: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(files.id, fileId));

    return {
      success: false,
      fileId,
      chunkCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### 2.2 Extract Storage Path from URL

```typescript
function getStoragePath(url: string): string {
  // URL format: https://project.supabase.co/storage/v1/object/public/course_material/documents/file.pdf
  
  // Try public format
  let urlParts = url.split("/storage/v1/object/public/course_material/");
  if (urlParts.length >= 2) {
    return urlParts[1]; // Returns: "documents/file.pdf"
  }

  // Try private format
  urlParts = url.split("/storage/v1/object/course_material/");
  if (urlParts.length >= 2) {
    return urlParts[1];
  }

  // Fallback
  const bucketIndex = url.indexOf("course_material/");
  if (bucketIndex !== -1) {
    return url.substring(bucketIndex + "course_material/".length);
  }

  throw new Error(`Invalid Supabase storage URL format: ${url}`);
}
```

---

## Phase 3: RAG Indexing

This phase transforms raw text into searchable semantic vectors.

### 3.1 Text Extraction

**File:** `src/lib/rag/text-extraction.ts`

#### 3.1.1 PDF Extraction with Page Tracking

```typescript
export async function extractPagedTextFromPdf(
  buffer: Buffer
): Promise<PagedText> {
  const PDFParser = (await import("pdf2json")).default;

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      const pages: Array<{
        pageNumber: number;
        text: string;
        startPosition: number;
        endPosition: number;
      }> = [];

      let fullText = "";
      let currentPosition = 0;

      if (pdfData.Pages) {
        for (let pageIndex = 0; pageIndex < pdfData.Pages.length; pageIndex++) {
          const page = pdfData.Pages[pageIndex];
          let pageText = "";

          // Extract text from page
          if (page.Texts) {
            for (const textElement of page.Texts) {
              if (textElement.R) {
                for (const textRun of textElement.R) {
                  if (textRun.T) {
                    // Decode URI-encoded text
                    pageText += decodeURIComponent(textRun.T) + " ";
                  }
                }
              }
            }
          }

          pageText = pageText.trim();
          const startPosition = currentPosition;
          const endPosition = currentPosition + pageText.length;

          pages.push({
            pageNumber: pageIndex + 1,
            text: pageText,
            startPosition,
            endPosition,
          });

          fullText += pageText + "\n";
          currentPosition = endPosition + 1;
        }
      }

      resolve({
        pages,
        fullText: fullText.trim(),
        metadata: {
          pageCount: pages.length,
          wordCount: fullText.trim().split(/\s+/).length,
        },
      });
    });

    pdfParser.on("pdfParser_dataError", (error: any) => {
      reject(new Error(`PDF parsing failed: ${error.parserError?.message}`));
    });

    pdfParser.parseBuffer(buffer);
  });
}
```

#### 3.1.2 DOCX Extraction

```typescript
export async function extractTextFromDocx(
  buffer: Buffer
): Promise<ExtractedText> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).length,
    },
  };
}
```

#### 3.1.3 PPTX Extraction

```typescript
export async function extractTextFromPptx(
  buffer: Buffer
): Promise<ExtractedText> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(buffer);

  let extractedText = "";
  let slideCount = 0;

  // Get all slide files
  const slideFiles = Object.keys(zipContent.files).filter((filename) =>
    filename.match(/^ppt\/slides\/slide\d+\.xml$/)
  );

  slideCount = slideFiles.length;

  for (const slideFile of slideFiles) {
    const slideXml = await zipContent.files[slideFile].async("text");

    // Extract text from <a:t> tags (PowerPoint text elements)
    const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);

    if (textMatches) {
      for (const match of textMatches) {
        const textContent = match
          .replace(/<a:t[^>]*>(.*?)<\/a:t>/, "$1")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");

        extractedText += textContent + " ";
      }
    }

    extractedText += "\n";
  }

  return {
    text: extractedText.trim(),
    metadata: {
      pageCount: slideCount,
      wordCount: extractedText.trim().split(/\s+/).length,
    },
  };
}
```

### 3.2 Text Chunking

**File:** `src/lib/rag/text-chunking.ts`

#### 3.2.1 Token Estimation

```typescript
export function estimateTokenCount(text: string): number {
  // Approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
```

#### 3.2.2 Page-Aware Chunking (for PDFs)

```typescript
export function chunkPagedText(
  pagedText: Array<{
    pageNumber: number;
    text: string;
    startPosition: number;
    endPosition: number;
  }>,
  maxTokens: number = 700,
  overlapTokens: number = 100
): PagedTextChunk[] {
  const chunks: PagedTextChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pagedText) {
    if (!page.text || page.text.trim().length === 0) continue;

    // Split page text into sentences
    const sentences = page.text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    let currentChunk = "";
    let chunkStartPosition = page.startPosition;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim() + ".";
      const potentialChunk = currentChunk + (currentChunk ? " " : "") + sentence;
      const tokenCount = estimateTokenCount(potentialChunk);

      if (tokenCount > maxTokens && currentChunk) {
        // Save current chunk
        const chunkLength = currentChunk.length;
        const chunkEndPosition = chunkStartPosition + chunkLength;

        chunks.push({
          text: currentChunk.trim(),
          index: globalChunkIndex++,
          tokenCount: estimateTokenCount(currentChunk),
          pageNumber: page.pageNumber,
          startPosition: chunkStartPosition,
          endPosition: chunkEndPosition,
        });

        // Create overlap for next chunk
        const words = currentChunk.split(" ");
        const overlapWords = Math.floor(
          words.length * (overlapTokens / estimateTokenCount(currentChunk))
        );
        const overlap = words.slice(-overlapWords).join(" ");

        currentChunk = overlap + (overlap ? " " : "") + sentence;
        chunkStartPosition = chunkEndPosition - overlap.length;
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
```

**Chunking Example:**

```
Page 1 Text: "Aerodynamics is the study of air flow. Air flows faster over curved surfaces. This creates lift on an aircraft wing. Bernoulli's principle explains this phenomenon..."

↓ Chunking (700 tokens max, 100 token overlap) ↓

Chunk 0 (Page 1, pos 0-2800):
"Aerodynamics is the study of air flow. Air flows faster over curved surfaces..."

Chunk 1 (Page 1, pos 2700-5500):
"...curved surfaces. This creates lift on an aircraft wing. Bernoulli's principle..."

Chunk 2 (Page 1, pos 5400-8200):
"...principle explains this phenomenon. The pressure difference..."
```

#### 3.2.3 Standard Chunking (for DOCX/PPTX)

```typescript
export function chunkText(
  text: string,
  maxTokens: number = 700,
  overlapTokens: number = 100
): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: TextChunk[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  let currentChunk = "";
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim() + ".";
    const potentialChunk = currentChunk + (currentChunk ? " " : "") + sentence;
    const tokenCount = estimateTokenCount(potentialChunk);

    if (tokenCount > maxTokens && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        tokenCount: estimateTokenCount(currentChunk),
      });

      // Start new chunk with overlap
      const words = currentChunk.split(" ");
      const overlapWords = Math.floor(
        words.length * (overlapTokens / estimateTokenCount(currentChunk))
      );
      const overlap = words.slice(-overlapWords).join(" ");

      currentChunk = overlap + (overlap ? " " : "") + sentence;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      tokenCount: estimateTokenCount(currentChunk),
    });
  }

  return chunks;
}
```

### 3.3 Embedding Generation

**File:** `src/lib/rag/embeddings.ts`

#### 3.3.1 Single Embedding

```typescript
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.textEmbedding('text-embedding-004'),
      value: text,
    });
    
    return embedding; // Returns 768-dimensional vector
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}
```

#### 3.3.2 Batch Embeddings

```typescript
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings: number[][] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => generateEmbedding(text));
      const batchEmbeddings = await Promise.all(batchPromises);
      embeddings.push(...batchEmbeddings);
      
      console.log(`🧠 Generated embeddings ${i+1}-${Math.min(i+batchSize, texts.length)} of ${texts.length}`);
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}
```

**Embedding Example:**

```
Input Text: "Aerodynamics is the study of air flow around objects."

↓ Google text-embedding-004 ↓

Output Vector (768 dimensions):
[0.0234, -0.0156, 0.0891, ..., -0.0234, 0.0567] // 768 values
```

### 3.4 Vector Storage

**Database Schema:**

```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER,           -- PDF page number
  start_position INTEGER,         -- Character position in document
  end_position INTEGER,           -- Character position end
  token_count INTEGER,
  embedding VECTOR(768),          -- pgvector type
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX idx_document_chunks_embedding 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

**Insertion Code:**

```typescript
const chunkRecords = chunks.map((chunk, index) => ({
  courseId: courseId,
  fileId: fileRecord.id,
  chunkText: chunk.text,
  chunkIndex: chunk.index,
  tokenCount: chunk.tokenCount,
  pageNumber: chunk.pageNumber || null,
  startPosition: chunk.startPosition || null,
  endPosition: chunk.endPosition || null,
  embedding: embeddings[index], // 768-dimensional array
}));

await db.insert(documentChunks).values(chunkRecords);
```

---

## Phase 4: Query & Retrieval

When a user asks a question in the chatbot, the system retrieves relevant context.

### 4.1 User Query Input

**File:** `src/app/chat/page.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  const userMessage: Message = { role: "user", content: input.trim() };
  const newConversation = [...conversation, userMessage];
  setConversation(newConversation);
  setInput("");
  setIsLoading(true);

  try {
    // Call chat action with mode (normal/deep) and videoMode
    const { messages, newMessage, chatId: returnedChatId } = 
      await continueConversation(
        newConversation,
        chatId,
        true,
        mode, // "normal" or "deep"
        videoMode
      );

    // Stream response
    let textContent = "";
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([
        ...messages,
        { role: "assistant", content: textContent },
      ]);
    }
  } catch (error) {
    console.error("Error in conversation:", error);
  } finally {
    setIsLoading(false);
  }
}
```

### 4.2 Chat Action Processing

**File:** `src/lib/actions/chat/actions.ts`

```typescript
export async function continueConversation(
  history: Message[],
  chatId?: string,
  shouldSave: boolean = true,
  mode: "normal" | "deep" = "normal",
  videoMode: boolean = false
) {
  const stream = createStreamableValue();
  let currentChatId = chatId;

  // Create chat if doesn't exist
  if (!currentChatId && shouldSave) {
    const firstUserMessage = history.find((msg) => msg.role === "user");
    const title = firstUserMessage?.content.slice(0, 50) + "...";
    const newChat = await createChat(title);
    currentChatId = newChat.id;
  }

  // Save user message
  if (currentChatId && shouldSave) {
    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage.role === "user") {
      await saveMessage(currentChatId, "user", lastUserMessage.content);
    }
  }

  // Start async processing
  (async () => {
    const lastUserMessage = history[history.length - 1];
    const userQuery = lastUserMessage?.role === "user" 
      ? lastUserMessage.content 
      : "";

    // Base system prompt for Wingman persona
    let systemPrompt = `You are "Wingman" a virtual teaching assistant...`;

    // 🔥 ADD RAG CONTEXT FOR DEEP MODE
    if (mode === "deep" && userQuery) {
      try {
        console.log("🔍 Deep Mode: Searching ALL course materials...");

        // Search across all indexed courses
        const relevantChunks = await searchAllCourses(
          userQuery,
          5,    // maxResults
          0.3   // similarityThreshold
        );

        if (relevantChunks.length > 0) {
          const context = formatContextForWingman(relevantChunks);
          
          systemPrompt += `

ADDITIONAL CONTEXT FROM COURSE MATERIALS:
${context}

IMPORTANT CITATION REQUIREMENTS:
- When using information from context, cite: [Source X: filename, Page Y]
- For direct quotes: "quoted text" [Source X: filename, Page Y]
- Always reference the specific source number`;

          console.log(`✅ Added ${relevantChunks.length} sources to context`);
        }
      } catch (error) {
        console.error("🚨 RAG search failed:", error);
      }
    }

    // Generate response with streaming
    const { textStream } = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: systemPrompt,
      messages: history,
    });

    let fullContent = "";
    for await (const text of textStream) {
      fullContent += text;
      stream.update(text);
    }

    // Save assistant response
    if (currentChatId && shouldSave && fullContent) {
      await saveMessage(currentChatId, "assistant", fullContent);
    }

    stream.done();
  })();

  return {
    messages: history,
    newMessage: stream.value,
    chatId: currentChatId,
  };
}
```

### 4.3 Global Course Search

**File:** `src/lib/rag/user-search.ts`

```typescript
export async function searchAllCourses(
  query: string,
  maxResults: number = 5,
  similarityThreshold: number = 0.7
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Searching ALL courses for: "${query}"`);

    // 1. Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    console.log("✅ Generated query embedding");

    // 2. Get all document chunks with file and course info
    const allChunks = await db
      .select({
        chunkId: documentChunks.id,
        chunkText: documentChunks.chunkText,
        chunkIndex: documentChunks.chunkIndex,
        embedding: documentChunks.embedding,
        fileId: documentChunks.fileId,
        fileName: files.originalName,
        courseId: documentChunks.courseId,
        courseTitle: courses.title,
        pageNumber: documentChunks.pageNumber,
        startPosition: documentChunks.startPosition,
        endPosition: documentChunks.endPosition,
      })
      .from(documentChunks)
      .innerJoin(files, eq(documentChunks.fileId, files.id))
      .innerJoin(courses, eq(documentChunks.courseId, courses.id))
      .orderBy(desc(documentChunks.createdAt));

    console.log(`📚 Found ${allChunks.length} total chunks`);

    if (allChunks.length === 0) {
      return [];
    }

    // 3. Calculate cosine similarity for each chunk
    const results: SearchResult[] = [];

    for (const chunk of allChunks) {
      if (chunk.embedding) {
        const similarity = cosineSimilarity(
          queryEmbedding,
          chunk.embedding as number[]
        );

        if (similarity >= similarityThreshold) {
          results.push({
            chunkId: chunk.chunkId,
            chunkText: chunk.chunkText,
            chunkIndex: chunk.chunkIndex,
            fileId: chunk.fileId,
            fileName: chunk.fileName,
            courseId: chunk.courseId,
            courseTitle: chunk.courseTitle,
            similarity,
            pageNumber: chunk.pageNumber,
            startPosition: chunk.startPosition,
            endPosition: chunk.endPosition,
          });
        }
      }
    }

    // 4. Sort by similarity and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, maxResults);

    console.log(`🎯 Found ${topResults.length} relevant chunks`);

    return topResults;
  } catch (error) {
    console.error("❌ Error searching all courses:", error);
    throw error;
  }
}
```

### 4.4 Cosine Similarity Calculation

**File:** `src/lib/rag/embeddings.ts`

```typescript
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];  // Sum of element-wise products
    normA += a[i] * a[i];        // Sum of squares for vector A
    normB += b[i] * b[i];        // Sum of squares for vector B
  }
  
  // Cosine similarity = dot(A,B) / (||A|| * ||B||)
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Similarity Example:**

```
Query: "What causes lift on an aircraft wing?"
Query Embedding: [0.0234, -0.0156, 0.0891, ..., 0.0567]

Chunk 1: "Bernoulli's principle states that faster air flow creates lower pressure..."
Chunk 1 Embedding: [0.0245, -0.0149, 0.0887, ..., 0.0571]
Similarity: 0.92 ✅ High match

Chunk 2: "The Wright brothers built the first airplane in 1903..."
Chunk 2 Embedding: [-0.0123, 0.0456, -0.0234, ..., -0.0123]
Similarity: 0.23 ❌ Low match
```

### 4.5 Course-Specific Search (Alternative)

**File:** `src/lib/rag/search.ts`

For course-specific searches, pgvector's native operators are used:

```typescript
export async function searchSimilarChunksWithSources(
  query: string,
  courseId: string,
  topK: number = 5,
  similarityThreshold: number = 0.3
): Promise<SearchResultWithSources[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Use pgvector's <=> operator for cosine distance
    const results = await db.execute(sql`
      SELECT 
        dc.id as chunk_id,
        dc.chunk_text,
        dc.chunk_index,
        dc.page_number,
        dc.start_position,
        dc.end_position,
        f.id as file_id,
        f.original_name as file_name,
        1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
      FROM document_chunks dc
      INNER JOIN files f ON dc.file_id = f.id
      WHERE dc.course_id = ${courseId}
        AND dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> ${embeddingStr}::vector) > ${similarityThreshold}
      ORDER BY dc.embedding <=> ${embeddingStr}::vector
      LIMIT ${topK}
    `);

    const searchResults: SearchResultWithSources[] = results.map((row: any) => ({
      chunkId: row.chunk_id,
      chunkText: row.chunk_text,
      chunkIndex: row.chunk_index,
      similarity: parseFloat(row.similarity),
      source: {
        fileId: row.file_id,
        fileName: row.file_name,
        pageNumber: row.page_number,
        startPosition: row.start_position,
        endPosition: row.end_position,
      },
    }));

    return searchResults;
  } catch (error) {
    console.error("❌ Error searching similar chunks:", error);
    throw error;
  }
}
```

### 4.6 Format Context for LLM

**File:** `src/lib/rag/user-search.ts`

```typescript
export function formatContextForWingman(
  searchResults: SearchResult[]
): string {
  if (searchResults.length === 0) {
    return "No relevant course materials found.";
  }

  return searchResults
    .map((result, index) => {
      const sourceNum = index + 1;
      const pageInfo = result.pageNumber 
        ? `, Page ${result.pageNumber}` 
        : "";
      
      return `[Source ${sourceNum}: ${result.fileName}${pageInfo}]
Course: ${result.courseTitle}
Similarity: ${(result.similarity * 100).toFixed(1)}%
Content: ${result.chunkText}

---`;
    })
    .join("\n\n");
}
```

**Formatted Context Example:**

```
[Source 1: Aerodynamics_Fundamentals.pdf, Page 12]
Course: Introduction to Aeronautics
Similarity: 92.3%
Content: Bernoulli's principle states that an increase in the speed of a fluid occurs simultaneously with a decrease in pressure. This principle is fundamental to understanding how lift is generated on an aircraft wing...

---

[Source 2: Flight_Mechanics.pdf, Page 5]
Course: Flight Dynamics
Similarity: 87.6%
Content: The four forces acting on an aircraft in flight are lift, weight, thrust, and drag. Lift is generated by the pressure difference between the upper and lower surfaces of the wing...

---
```

---

## Phase 5: Response Generation

### 5.1 LLM Prompt Construction

The final prompt sent to Google Gemini looks like this:

```
SYSTEM PROMPT:
You are "Wingman" a virtual teaching assistant for NIAT students.
[... persona details ...]

ADDITIONAL CONTEXT FROM COURSE MATERIALS:
[Source 1: Aerodynamics_Fundamentals.pdf, Page 12]
Course: Introduction to Aeronautics
Similarity: 92.3%
Content: Bernoulli's principle states that...
---
[Source 2: Flight_Mechanics.pdf, Page 5]
Course: Flight Dynamics
Similarity: 87.6%
Content: The four forces acting on an aircraft...
---

IMPORTANT CITATION REQUIREMENTS:
- When using information from context, cite: [Source X: filename, Page Y]
- For direct quotes: "quoted text" [Source X: filename, Page Y]

USER MESSAGE:
What causes lift on an aircraft wing?

CONVERSATION HISTORY:
[Previous messages...]
```

### 5.2 Streaming Response

**File:** `src/lib/actions/chat/actions.ts`

```typescript
// Generate response with streaming
const { textStream } = streamText({
  model: google("gemini-2.5-flash-lite"),
  system: systemPrompt,
  messages: history,
});

let fullContent = "";
for await (const text of textStream) {
  fullContent += text;
  stream.update(text); // Stream to client in real-time
}

// Save complete response
if (currentChatId && shouldSave && fullContent) {
  await saveMessage(currentChatId, "assistant", fullContent);
}

stream.done();
```

### 5.3 Example Response with Citations

**AI Response:**

```
Great question! Lift on an aircraft wing is generated through a combination of factors:

1. **Pressure Difference**: According to Bernoulli's principle, "an increase in the speed of a fluid occurs simultaneously with a decrease in pressure" [Source 1: Aerodynamics_Fundamentals.pdf, Page 12]. This means that air flowing faster over the curved upper surface of the wing creates lower pressure compared to the slower-moving air beneath the wing.

2. **Four Forces in Flight**: As explained in the course materials, "the four forces acting on an aircraft in flight are lift, weight, thrust, and drag" [Source 2: Flight_Mechanics.pdf, Page 5]. Lift specifically is generated by this pressure difference between the upper and lower wing surfaces.

3. **Wing Design**: The airfoil shape is carefully designed to maximize this pressure difference. Would you like me to explain how wing geometry affects lift generation?

Does this help clarify the concept? Feel free to ask if you want to dive deeper into any aspect!
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: FILE UPLOAD                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
    User selects file (PDF/DOCX/PPTX) in CourseCreator
                                    │
                                    ▼
    Validate file (type, size) → courseService.validateFile()
                                    │
                                    ▼
    Create course structure → courseService.createCourse()
         (Course → Topics → Lessons)
                                    │
                                    ▼
    Upload file → courseService.uploadFile() → /api/upload
                                    │
                                    ▼
    POST /api/upload:
      1. Authenticate user
      2. Validate file
      3. Upload to Supabase Storage (bucket: course_material)
      4. Get public URL
      5. Save file record to database (files table)
      6. Link file to lesson (lessons.file_id)
      7. 🔥 Trigger processDocument(fileId) asynchronously
      8. Return success (don't wait for processing)

┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: DOCUMENT PROCESSING                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
    processDocument(fileId) starts
                                    │
                                    ▼
    1. Get file record from database
    2. Update status: "pending" → "processing"
    3. Download file from Supabase Storage
    4. Convert to Buffer
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 3: RAG INDEXING                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    │                                                               │
    ▼                                                               ▼
PDF Path                                                    DOCX/PPTX Path
    │                                                               │
    ▼                                                               ▼
extractPagedTextFromPdf(buffer)                    extractText(buffer, mimeType)
    │                                                               │
    │ - Use pdf2json                                                │ - Use mammoth (DOCX)
    │ - Extract text per page                                       │ - Use JSZip (PPTX)
    │ - Track page numbers                                          │ - Extract all text
    │ - Track character positions                                   │
    │                                                               │
    ▼                                                               ▼
PagedText {                                              ExtractedText {
  pages: [                                                 text: "...",
    { pageNumber: 1, text: "...",                          metadata: { wordCount }
      startPosition: 0, endPosition: 2500 },             }
    { pageNumber: 2, text: "...",
      startPosition: 2501, endPosition: 5000 }
  ],
  fullText: "...",
  metadata: { pageCount, wordCount }
}
    │                                                               │
    ▼                                                               ▼
chunkPagedText(pages)                                        chunkText(text)
    │                                                               │
    │ - Max 700 tokens per chunk                                   │ - Max 700 tokens
    │ - 100 token overlap                                          │ - 100 token overlap
    │ - Preserve page info                                         │ - No page info
    │ - Sentence boundaries                                        │ - Sentence boundaries
    │                                                               │
    ▼                                                               ▼
PagedTextChunk[] {                                           TextChunk[] →
  [                                                          Convert to PagedTextChunk
    { text, index: 0, tokenCount: 650,                      with pageNumber: 1
      pageNumber: 1, startPos: 0, endPos: 2600 },
    { text, index: 1, tokenCount: 680,
      pageNumber: 1, startPos: 2500, endPos: 5100 },
    ...
  ]
}
    │                                                               │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
    Generate embeddings for all chunks
    generateEmbeddings(chunkTexts[])
                                    │
                                    ▼
    Process in batches of 10
    Google text-embedding-004 API
    Returns 768-dimensional vectors
                                    │
                                    ▼
    Embeddings: number[][] {
      [
        [0.0234, -0.0156, ..., 0.0567],  // Chunk 0
        [0.0245, -0.0149, ..., 0.0571],  // Chunk 1
        ...
      ]
    }
                                    │
                                    ▼
    Get courseId (lesson → topic → course)
                                    │
                                    ▼
    Store in database (document_chunks table):
    For each chunk:
      - chunk_text
      - chunk_index
      - page_number (if available)
      - start_position, end_position
      - token_count
      - embedding VECTOR(768)
      - course_id, file_id
                                    │
                                    ▼
    Update file status: "processing" → "completed"
    Set chunk_count
                                    │
                                    ▼
    ✅ Document processing complete!

┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 4: QUERY & RETRIEVAL                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
    User asks question in chat
    "What causes lift on an aircraft wing?"
                                    │
                                    ▼
    continueConversation(history, mode="deep")
                                    │
                                    ▼
    Generate query embedding
    generateEmbedding(userQuery)
                                    │
                                    ▼
    Query Embedding: [0.0234, -0.0156, ..., 0.0567]
                                    │
                                    ▼
    searchAllCourses(query, maxResults=5, threshold=0.3)
                                    │
                                    ▼
    Get all document chunks from database
    with their embeddings, file names, course titles
                                    │
                                    ▼
    For each chunk:
      Calculate cosine similarity
      cosineSimilarity(queryEmbedding, chunkEmbedding)
                                    │
                                    ▼
    Filter chunks by similarity >= 0.3
    Sort by similarity (highest first)
    Take top 5 results
                                    │
                                    ▼
    SearchResult[] {
      [
        { chunkText: "Bernoulli's principle...",
          fileName: "Aerodynamics.pdf",
          pageNumber: 12,
          similarity: 0.923,
          courseTitle: "Intro to Aeronautics" },
        { chunkText: "Four forces of flight...",
          fileName: "Flight_Mechanics.pdf",
          pageNumber: 5,
          similarity: 0.876,
          courseTitle: "Flight Dynamics" },
        ...
      ]
    }
                                    │
                                    ▼
    formatContextForWingman(results)
    Create formatted context with citations
                                    │
                                    ▼
    Context String:
    "[Source 1: Aerodynamics.pdf, Page 12]
     Course: Intro to Aeronautics
     Similarity: 92.3%
     Content: Bernoulli's principle states that...
     ---
     [Source 2: Flight_Mechanics.pdf, Page 5]
     Course: Flight Dynamics
     Similarity: 87.6%
     Content: Four forces of flight are...
     ---"

┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 5: RESPONSE GENERATION                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    Construct LLM Prompt:
      System: Wingman persona + citation requirements
      Context: Formatted search results
      History: Previous conversation
      User: Current question
                                    │
                                    ▼
    streamText({
      model: google("gemini-2.5-flash-lite"),
      system: systemPrompt + context,
      messages: history
    })
                                    │
                                    ▼
    Google Gemini generates response with citations
    Streams text in real-time to client
                                    │
                                    ▼
    AI Response:
    "Great question! Lift is generated through...
     According to Bernoulli's principle, 'an increase
     in the speed of a fluid...' [Source 1: 
     Aerodynamics.pdf, Page 12].
     
     The four forces acting on an aircraft...
     [Source 2: Flight_Mechanics.pdf, Page 5].
     
     Would you like me to explain wing geometry?"
                                    │
                                    ▼
    Save message to database (messages table)
    Display to user with proper formatting
                                    │
                                    ▼
    ✅ Complete RAG pipeline executed!
```

---

## Error Handling

### Processing Errors

```typescript
// File processing error handling
try {
  const result = await processDocument(fileId);
  if (!result.success) {
    // Update file status to 'failed'
    await db.update(files)
      .set({
        processingStatus: "failed",
        processingError: result.error
      })
      .where(eq(files.id, fileId));
  }
} catch (error) {
  console.error("Processing failed:", error);
  // Store error in database for debugging
}
```

### Search Errors

```typescript
// Graceful degradation for search failures
try {
  const relevantChunks = await searchAllCourses(query);
  if (relevantChunks.length > 0) {
    // Add context to prompt
  } else {
    // Proceed without context
    console.log("No relevant context found");
  }
} catch (error) {
  console.error("Search failed:", error);
  // Continue with general knowledge response
}
```

### Upload Errors

```typescript
// Upload validation and error handling
if (file.size > 100 * 1024 * 1024) {
  return NextResponse.json(
    { error: "File size must be less than 100MB" },
    { status: 400 }
  );
}

if (uploadError) {
  console.error("Supabase upload error:", uploadError);
  return NextResponse.json(
    { error: "Failed to upload file to storage" },
    { status: 500 }
  );
}
```

---

## Performance Considerations

### 1. Asynchronous Processing

File processing happens asynchronously after upload returns success:

```typescript
// Upload API returns immediately
processDocument(savedFile.id)
  .then((result) => console.log("✅ Processing complete"))
  .catch((error) => console.error("❌ Processing failed"));

return NextResponse.json({ success: true, file: savedFile });
```

### 2. Batch Embedding Generation

Embeddings are generated in batches to avoid rate limits:

```typescript
const batchSize = 10;
for (let i = 0; i < texts.length; i += batchSize) {
  const batch = texts.slice(i, i + batchSize);
  const batchEmbeddings = await Promise.all(
    batch.map(text => generateEmbedding(text))
  );
  embeddings.push(...batchEmbeddings);
}
```

### 3. Database Indexing

pgvector indexes enable fast similarity search:

```sql
CREATE INDEX idx_document_chunks_embedding 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX idx_document_chunks_course_id 
ON document_chunks (course_id);
```

### 4. Similarity Thresholds

Different thresholds for different use cases:

- **Course-specific search**: 0.3 (more permissive)
- **Global search**: 0.7 (more strict)
- Adjustable based on result quality

### 5. Result Limiting

```typescript
// Limit results to top K most relevant
const topK = 5;
const results = allResults
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, topK);
```

---

## Key Takeaways

1. **File Upload is Immediate**: Users get instant feedback while processing happens in background
2. **Asynchronous Processing**: Document processing doesn't block the upload response
3. **Format-Specific Extraction**: Different handlers for PDF, DOCX, PPTX with page tracking for PDFs
4. **Semantic Chunking**: 700-token chunks with 100-token overlap preserve context
5. **Vector Search**: 768-dimensional embeddings enable semantic similarity matching
6. **Source Attribution**: Page numbers and positions enable precise citations
7. **Graceful Degradation**: System works even if RAG search fails
8. **Streaming Responses**: Real-time AI responses improve user experience

This complete pipeline transforms static documents into a dynamic, searchable knowledge base that powers contextual AI responses with proper citations and source attribution.
