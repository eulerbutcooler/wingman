import { NextRequest, NextResponse } from 'next/server';
import { processDocument, processDocuments } from '@/lib/rag/document-processor';

// POST /api/process-documents - Process uploaded documents for RAG
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, fileIds } = body;

    console.log('📝 Document processing request:', { fileId, fileIds });

    if (!fileId && !fileIds) {
      return NextResponse.json(
        { error: 'Either fileId or fileIds must be provided' },
        { status: 400 }
      );
    }

    let results;
    
    if (fileId) {
      // Process single document
      const result = await processDocument(fileId);
      results = [result];
    } else {
      // Process multiple documents
      results = await processDocuments(fileIds);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunkCount, 0);

    console.log(`✅ Processing completed: ${successCount} successful, ${failureCount} failed, ${totalChunks} total chunks`);

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount} documents successfully`,
      results,
      summary: {
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        totalChunks
      }
    });

  } catch (error) {
    console.error('💥 Error processing documents:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/process-documents - Check processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId parameter is required' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db/drizzle');
    const { files } = await import('@/lib/db/schema/courses');
    const { eq } = await import('drizzle-orm');

    const [fileRecord] = await db
      .select({
        id: files.id,
        originalName: files.originalName,
        processingStatus: files.processingStatus,
        processingError: files.processingError,
        chunkCount: files.chunkCount
      })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      file: fileRecord
    });

  } catch (error) {
    console.error('Error checking processing status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check processing status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
