import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@/lib/db/drizzle';
import { files } from '@/lib/db/schema/courses';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
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

// Generate unique S3 key
function generateS3Key(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  
  return `courses/${userId}/${timestamp}_${randomString}_${nameWithoutExt}.${extension}`;
}

// POST /api/upload-s3 - Upload file to AWS S3
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

    // Generate S3 key
    const s3Key = generateS3Key(file.name, userId);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        userId: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);

    // Create public URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

    // Save file metadata to database
    const [savedFile] = await db.insert(files).values({
      originalName: file.name,
      filename: s3Key,
      mimeType: file.type,
      size: file.size,
      url: fileUrl,
      lessonId: lessonId || null,
      userId,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to S3',
      file: {
        id: savedFile.id,
        originalName: savedFile.originalName,
        filename: savedFile.filename,
        url: savedFile.url,
        size: savedFile.size,
        type: validation.fileType,
      },
    });

  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to S3' },
      { status: 500 }
    );
  }
}

// GET /api/upload-s3 - Generate presigned URL for direct upload
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const userId = searchParams.get('userId');

    if (!fileName || !fileType || !userId) {
      return NextResponse.json(
        { error: 'fileName, fileType, and userId are required' },
        { status: 400 }
      );
    }

    // Generate S3 key
    const s3Key = generateS3Key(fileName, userId);

    // Create presigned URL for direct upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // 1 hour
    });

    return NextResponse.json({
      success: true,
      uploadUrl: signedUrl,
      fileUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`,
      s3Key,
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
