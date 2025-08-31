import { NextRequest, NextResponse } from 'next/server';
import { processDocument } from '@/lib/rag/document-processor';

// POST /api/manual-process - Manually trigger document processing
export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId is required' },
        { status: 400 }
      );
    }

    console.log('🔧 Manual processing triggered for file:', fileId);

    // Process the document
    const result = await processDocument(fileId);

    console.log('✅ Manual processing result:', result);

    return NextResponse.json({
      success: true,
      message: 'Document processing completed',
      result
    });

  } catch (error) {
    console.error('💥 Manual processing failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/manual-process - Check processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId is required' },
        { status: 400 }
      );
    }

    // Check file status in database
    const { db } = await import('@/lib/db/drizzle');
    const { files } = await import('@/lib/db/schema/courses');
    const { eq } = await import('drizzle-orm');

    const fileRecord = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (fileRecord.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord[0].id,
        originalName: fileRecord[0].originalName,
        processingStatus: fileRecord[0].processingStatus,
        processingError: fileRecord[0].processingError,
        chunkCount: fileRecord[0].chunkCount
      }
    });

  } catch (error) {
    console.error('Error checking file status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check file status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
