import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '@/lib/db/drizzle';
import { files } from '@/lib/db/schema/courses';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

// Validate file type and size
function validateFile(file: File) {
  const errors: string[] = [];
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isPDF = ALLOWED_PDF_TYPES.includes(file.type);
  
  if (!isVideo && !isPDF) {
    errors.push('Only MP4, WebM, MOV, AVI videos and PDF files are supported');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileType: isVideo ? 'video' : 'pdf' as 'video' | 'pdf'
  };
}

// POST /api/upload-cloudinary - Upload file to Cloudinary
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const lessonId = formData.get('lessonId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'File validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique public ID
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const publicId = `courses/${userId}/${timestamp}_${randomString}_${nameWithoutExt}`;

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: validation.fileType === 'video' ? 'video' : 'raw',
          folder: `courses/${userId}`,
          context: {
            originalName: file.name,
            userId: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const result = uploadResult as any;

    // Save file metadata to database
    const [savedFile] = await db.insert(files).values({
      originalName: file.name,
      filename: result.public_id,
      mimeType: file.type,
      size: file.size,
      url: result.secure_url,
      lessonId: lessonId || null,
      userId,
      createdAt: new Date(),
    }).returning();

    // Extract additional metadata for videos
    let metadata: any = {};
    if (validation.fileType === 'video' && result.duration) {
      const duration = result.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      metadata.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      metadata.thumbnail = result.secure_url.replace(/\.[^/.]+$/, '.jpg');
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to Cloudinary',
      file: {
        id: savedFile.id,
        originalName: savedFile.originalName,
        filename: savedFile.filename,
        url: savedFile.url,
        size: savedFile.size,
        type: validation.fileType,
        ...metadata,
      },
    });

  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to Cloudinary' },
      { status: 500 }
    );
  }
}

// GET /api/upload-cloudinary - Generate signed upload URL
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

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: `courses/${userId}`,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      success: true,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: `courses/${userId}`,
    });

  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
