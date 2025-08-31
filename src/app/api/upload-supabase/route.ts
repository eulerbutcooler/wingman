import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth/supabase';
import { db } from '@/lib/db/drizzle';
import { files } from '@/lib/db/schema/courses';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_PPTX_TYPES = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow', // .ppsx
];
const ALLOWED_DOCX_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Validate file type and size
function validateFile(file: File, expectedType?: string) {
  const errors: string[] = [];
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isPDF = ALLOWED_PDF_TYPES.includes(file.type);
  const isPPTX = ALLOWED_PPTX_TYPES.includes(file.type);
  const isDOCX = ALLOWED_DOCX_TYPES.includes(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  
  // If expectedType is specified, validate against it
  if (expectedType === 'image' && !isImage) {
    errors.push('Only JPEG, PNG, and WebP images are supported');
  } else if (expectedType !== 'image' && !isVideo && !isPDF && !isPPTX && !isDOCX) {
    errors.push('Only MP4, WebM, MOV, AVI videos, PDF files, PowerPoint presentations (.pptx, .ppsx), and Word documents (.docx) are supported');
  } else if (!expectedType && !isVideo && !isPDF && !isPPTX && !isDOCX && !isImage) {
    errors.push('Only MP4, WebM, MOV, AVI videos, PDF files, PowerPoint presentations (.pptx, .ppsx), Word documents (.docx), and JPEG/PNG/WebP images are supported');
  }
  
  let fileType: 'video' | 'pdf' | 'pptx' | 'docx' | 'image';
  if (isVideo) fileType = 'video';
  else if (isPDF) fileType = 'pdf';
  else if (isPPTX) fileType = 'pptx';
  else if (isDOCX) fileType = 'docx';
  else fileType = 'image';
  
  return {
    isValid: errors.length === 0,
    errors,
    fileType
  };
}

// POST /api/upload-supabase - Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Supabase upload started...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const lessonId = formData.get('lessonId') as string | null;
    const topicId = formData.get('topicId') as string | null;
    const type = formData.get('type') as string | null; // 'image' for course images

    console.log('📝 Upload parameters:', {
      fileName: file?.name,
      fileSize: file?.size,
      userId,
      lessonId,
      topicId,
      type
    });

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      console.log('❌ No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file, type || undefined);
    if (!validation.isValid) {
      console.log('❌ File validation failed:', validation.errors);
      return NextResponse.json({ 
        error: 'File validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    console.log('✅ File validation passed:', validation.fileType);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('✅ File converted to buffer, size:', buffer.length);

    // Generate unique file path with organized folder structure
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || '';
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    
    // Organize files by type and user
    let folderPath;
    if (validation.fileType === 'image' && type === 'image') {
      folderPath = `course-images/${userId}`;
    } else if (validation.fileType === 'video') {
      folderPath = `lesson-videos/${userId}`;
    } else if (validation.fileType === 'pdf') {
      folderPath = `lesson-pdfs/${userId}`;
    } else if (validation.fileType === 'pptx') {
      folderPath = `lesson-presentations/${userId}`;
    } else if (validation.fileType === 'docx') {
      folderPath = `lesson-documents/${userId}`;
    } else {
      folderPath = `misc-files/${userId}`;
    }
    
    const fileName = `${timestamp}_${randomString}_${nameWithoutExt}.${fileExtension}`;
    const filePath = `${folderPath}/${fileName}`;
    console.log('📁 Upload path:', filePath);

    // Upload to Supabase Storage
    console.log('🚀 Starting Supabase upload...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wingman-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.log('❌ Supabase upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file to Supabase Storage',
        details: uploadError.message
      }, { status: 500 });
    }

    console.log('✅ Supabase upload success:', {
      path: uploadData.path,
      fullPath: uploadData.fullPath
    });

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('wingman-files')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('🔗 Public URL:', publicUrl);

    // For images, we don't need to save to files table if it's a course image
    if (validation.fileType === 'image' && type === 'image') {
      console.log('✅ Image upload completed (not saved to database)');
      return NextResponse.json({
        success: true,
        message: 'Image uploaded successfully to Supabase Storage',
        file: {
          url: publicUrl,
          filename: fileName,
          type: validation.fileType,
        },
      });
    }

    console.log('💾 Saving file metadata to database...');
    // Save file metadata to database for videos, PDFs, PPTX, and DOCX
    
    // Validate UUIDs or set to null
    const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const safeLessonId = lessonId && validUuidRegex.test(lessonId) ? lessonId : null;
    const safeTopicId = topicId && validUuidRegex.test(topicId) ? topicId : null;
    
    console.log('🔍 UUID validation:', {
      originalLessonId: lessonId,
      validLessonId: safeLessonId,
      originalTopicId: topicId,
      validTopicId: safeTopicId
    });

    const [savedFile] = await db.insert(files).values({
      originalName: file.name,
      filename: fileName,
      mimeType: file.type,
      size: file.size,
      url: publicUrl,
      lessonId: safeLessonId,
      topicId: safeTopicId,
      userId,
      createdAt: new Date(),
    }).returning();

    console.log('✅ File metadata saved to database:', {
      id: savedFile.id,
      url: savedFile.url,
      lessonId: savedFile.lessonId,
      topicId: savedFile.topicId
    });

    // Extract additional metadata for videos
    const metadata: any = {};
    if (validation.fileType === 'video') {
      // For videos uploaded to Supabase, we can't easily extract duration
      // You might want to use a video processing library or service for this
      metadata.thumbnail = publicUrl; // Use the video file URL as thumbnail for now
      console.log('🎥 Video uploaded:', metadata);
    }

    console.log('🎉 Upload process completed successfully');
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to Supabase Storage',
      file: {
        id: savedFile.id,
        originalName: savedFile.originalName,
        filename: savedFile.filename,
        url: savedFile.url,
        size: savedFile.size,
        type: validation.fileType,
        lessonId: savedFile.lessonId,
        topicId: savedFile.topicId,
        ...metadata,
      },
    });

  } catch (error) {
    console.error('💥 Error uploading file to Supabase Storage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file to Supabase Storage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/upload-supabase - Get signed upload URL (if needed for direct uploads)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // For Supabase, we can provide information about the bucket
    return NextResponse.json({
      success: true,
      message: 'Use POST method to upload files directly to Supabase Storage',
      endpoint: '/api/upload-supabase',
      bucket: 'wingman-files',
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes: {
        videos: ALLOWED_VIDEO_TYPES,
        documents: [...ALLOWED_PDF_TYPES, ...ALLOWED_PPTX_TYPES, ...ALLOWED_DOCX_TYPES],
        images: ALLOWED_IMAGE_TYPES
      }
    });

  } catch (error) {
    console.error('Error getting Supabase upload info:', error);
    return NextResponse.json(
      { error: 'Failed to get upload information' },
      { status: 500 }
    );
  }
}
