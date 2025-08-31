# Cloudinary Integration for Course File Upload

This document describes the Cloudinary integration implemented for uploading course files (PDFs, videos, and images) to the cloud.

## Overview

The course creation system now uses Cloudinary for file storage instead of local storage. This provides:

- Scalable cloud storage
- Automatic file optimization
- CDN delivery
- Video processing capabilities
- Image transformations

## Features Implemented

### 1. File Upload to Cloudinary
- **Videos**: MP4, WebM, MOV, AVI (up to 100MB)
- **PDFs**: PDF documents (up to 100MB)  
- **Images**: JPEG, PNG, WebP (up to 10MB)

### 2. Course Image Upload
- Users can upload course cover images
- Automatic fallback to generated placeholder if no image provided
- Real-time upload progress

### 3. Lesson File Upload
- Support for video and PDF lesson content
- Progress tracking during upload
- Automatic file URL storage in database

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

### POST /api/upload-cloudinary
Uploads files to Cloudinary with support for:
- Videos (stored as video resource type)
- PDFs (stored as raw resource type)
- Images (stored as image resource type)

**Parameters:**
- `file`: The file to upload
- `userId`: User ID for organizing files
- `lessonId`: (optional) Link file to specific lesson
- `type`: (optional) Set to 'image' for course images

### GET /api/upload-cloudinary
Generates signed upload URLs for direct uploads (if needed)

## File Organization

Files are organized in Cloudinary with the following structure:
```
courses/
  └── {userId}/
      ├── {timestamp}_{random}_{filename}.ext
      └── ...
```

## Database Schema

### Files Table
- `id`: Unique identifier
- `originalName`: Original filename
- `filename`: Cloudinary public_id
- `url`: Cloudinary secure URL
- `size`: File size in bytes
- `mimeType`: File MIME type
- `lessonId`: Links to lesson (nullable)
- `userId`: User who uploaded the file

### Lessons Table
- `fileUrl`: Direct link to Cloudinary file
- `duration`: Video duration (auto-extracted)

## Usage in Components

### CourseCreator Component
The CourseCreator component now includes:

1. **Image Upload Section**: Users can upload course cover images
2. **Lesson File Upload**: Each lesson can have an associated video or PDF
3. **Progress Tracking**: Real-time upload progress for all files
4. **Validation**: Client-side file validation before upload

### Example Usage

```typescript
// Upload course image
const result = await courseService.uploadImage(file, userId);
console.log('Image URL:', result.url);

// Upload lesson file
const uploadedFile = await courseService.uploadFile(
  file, 
  userId, 
  lessonId,
  (progress) => console.log(`Progress: ${progress}%`)
);
```

## Error Handling

The system includes comprehensive error handling for:
- File size limits
- Unsupported file types
- Network errors
- Cloudinary API errors

## Benefits

1. **Scalability**: No local storage limitations
2. **Performance**: CDN delivery for fast file access
3. **Optimization**: Automatic video and image optimization
4. **Reliability**: Cloud-based storage with high availability
5. **Security**: Secure file URLs and access control

## Future Enhancements

Potential improvements:
- Video thumbnail generation
- Image resizing and optimization
- Direct upload from client (signed uploads)
- File compression options
- Backup strategies
