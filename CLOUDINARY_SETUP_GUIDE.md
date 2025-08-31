# Updated Cloudinary Integration Guide

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Cloudinary Configuration (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Database Configuration
DATABASE_URL=your_database_url_here

# NextAuth Configuration  
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**To get your Cloudinary credentials:**
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Go to your Dashboard
3. Copy the Cloud Name, API Key, and API Secret

## New Features Added

### 1. PowerPoint Support
- **Supported formats**: `.pptx`, `.ppt`
- **File size limit**: 100MB
- **Storage**: Uploaded to Cloudinary as raw files

### 2. Enhanced File Tracking
- **Topic ID**: Files are now linked to both lessons AND topics
- **Lesson ID**: Maintains existing lesson relationship
- **User ID**: Tracks who uploaded the file

### 3. Updated Course Creator UI
- New PowerPoint option in lesson type dropdown
- Dynamic file input accepts appropriate file types:
  - Videos: `.mp4`, `.webm`, `.mov`, `.avi`
  - PDFs: `.pdf`
  - PowerPoints: `.pptx`, `.ppt`

## Database Schema Changes

### Files Table Structure:
```sql
files (
  id uuid PRIMARY KEY,
  original_name text NOT NULL,
  filename text NOT NULL,        -- Cloudinary public_id
  mime_type text NOT NULL,
  size integer NOT NULL,
  url text NOT NULL,            -- Cloudinary secure_url
  lesson_id uuid REFERENCES lessons(id),  -- Links to specific lesson
  topic_id uuid REFERENCES topics(id),    -- Links to topic (NEW)
  user_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamp DEFAULT now()
)
```

### Lessons Table Updated:
```sql
lessons (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  type text CHECK (type IN ('video', 'pdf', 'pptx')),  -- Added 'pptx'
  file_url text,               -- Cloudinary URL
  duration text,               -- For videos only
  topic_id uuid REFERENCES topics(id),
  order integer NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

## API Endpoints

### POST /api/upload-cloudinary
**Enhanced with:**
- PowerPoint file support
- Topic ID tracking
- Improved validation

**Parameters:**
```typescript
{
  file: File,                    // The file to upload
  userId: string,               // User uploading the file
  lessonId?: string,            // Optional: link to specific lesson
  topicId?: string,             // Optional: link to topic
  type?: 'image'                // Optional: specify image uploads
}
```

**Response:**
```typescript
{
  success: boolean,
  file: {
    id: string,                 // Database file ID
    originalName: string,       // Original filename
    filename: string,           // Cloudinary public_id
    url: string,                // Cloudinary secure URL
    size: number,               // File size in bytes
    type: 'video' | 'pdf' | 'pptx' | 'image',
    duration?: string,          // For videos only
    thumbnail?: string          // For videos only
  }
}
```

## File Organization in Cloudinary

```
courses/
├── {userId}/
│   ├── images/                 # Course cover images
│   │   └── {timestamp}_{random}_{filename}.jpg
│   ├── videos/                 # Lesson videos
│   │   └── {timestamp}_{random}_{filename}.mp4
│   ├── pdfs/                   # PDF documents
│   │   └── {timestamp}_{random}_{filename}.pdf
│   └── presentations/          # PowerPoint files
│       └── {timestamp}_{random}_{filename}.pptx
```

## Usage Examples

### 1. Course Creation with Files
```typescript
// User selects course image
await courseService.uploadImage(imageFile, userId);

// User adds lesson with PowerPoint
const uploadedFile = await courseService.uploadFile(
  pptxFile, 
  userId, 
  lessonId, 
  topicId
);

// Update lesson with file URL
await courseService.updateLesson(lessonId, {
  fileUrl: uploadedFile.url
});
```

### 2. File Validation
```typescript
// Validate lesson file
const validation = courseService.validateFile(file);
if (!validation.isValid) {
  console.error(validation.error);
  return;
}

// validation.fileType will be 'video', 'pdf', or 'pptx'
```

## Database Queries

### Get all files for a course:
```sql
SELECT f.*, l.title as lesson_title, t.title as topic_title
FROM files f
LEFT JOIN lessons l ON f.lesson_id = l.id
LEFT JOIN topics t ON f.topic_id = t.id
WHERE f.user_id = ? AND l.topic_id IN (
  SELECT id FROM topics WHERE course_id = ?
);
```

### Get files by type:
```sql
SELECT * FROM files f
JOIN lessons l ON f.lesson_id = l.id
WHERE l.type = 'pptx' AND f.user_id = ?;
```

## Benefits

1. **Complete File Support**: Videos, PDFs, PowerPoints, and Images
2. **Robust Tracking**: Files linked to users, topics, and lessons
3. **Cloud Storage**: Scalable Cloudinary infrastructure
4. **Progress Tracking**: Real-time upload progress
5. **Organized Structure**: Clear file organization in cloud storage
6. **Database Integrity**: Foreign key constraints ensure data consistency

## Testing

Your implementation is now ready for production with:
- ✅ Environment variables documented
- ✅ Database schema updated and migrated
- ✅ PowerPoint support added
- ✅ Enhanced file tracking implemented
- ✅ Build passing successfully

## Next Steps

1. Add your Cloudinary credentials to `.env.local`
2. Test file uploads in development
3. Deploy to production with environment variables set
4. Monitor file storage and usage in Cloudinary dashboard
