# Supabase Storage Integration Guide

This guide outlines the file upload system using Supabase Storage instead of Cloudinary.

## Supported File Types

- **Videos**: MP4, WebM, MOV, AVI (up to 100MB)
- **Documents**: PDF, DOCX, DOC (up to 100MB)
- **Presentations**: PPTX, PPT, PPSX (up to 100MB)
- **Images**: JPEG, PNG, WebP (up to 100MB)

## Environment Variables

Your `.env` file should contain:

```env
SUPABASE_URL=https://your-project.supabase.co/
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## File Organization

Files are organized in the following structure within the `wingman-files` bucket:

```
wingman-files/
├── course-images/{userId}/
├── lesson-videos/{userId}/
├── lesson-pdfs/{userId}/
├── lesson-presentations/{userId}/
├── lesson-documents/{userId}/
└── misc-files/{userId}/
```

## Database Schema

### Files Table
```sql
files (
  id uuid PRIMARY KEY,
  original_name text NOT NULL,
  filename text NOT NULL,        -- Generated filename
  mime_type text NOT NULL,
  size integer NOT NULL,
  url text NOT NULL,             -- Supabase Storage URL
  lesson_id uuid REFERENCES lessons(id),
  topic_id uuid REFERENCES topics(id),
  user_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamp DEFAULT NOW()
)
```

### Lessons Table
```sql
lessons (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  type text CHECK (type IN ('video', 'pdf', 'pptx', 'docx')),
  file_url text,               -- Supabase Storage URL
  duration text,               -- For videos (e.g., "12:45")
  topic_id uuid REFERENCES topics(id),
  order integer NOT NULL,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
)
```

## API Endpoints

### POST /api/upload-supabase

Upload files to Supabase Storage.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: File to upload
  - `userId`: User ID
  - `lessonId`: Lesson ID (optional)
  - `topicId`: Topic ID (optional)
  - `type`: 'image' for course images (optional)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully to Supabase Storage",
  "file": {
    "id": "uuid",
    "originalName": "document.pdf",
    "filename": "timestamp_random_document.pdf",
    "url": "https://your-project.supabase.co/storage/v1/object/public/wingman-files/...",
    "size": 1024000,
    "type": "pdf",
    "lessonId": "uuid",
    "topicId": "uuid"
  }
}
```

### GET /api/upload-supabase

Get upload information and supported file types.

## Supabase Storage Setup

1. **Create Storage Bucket:**
   Run the SQL commands in `supabase_storage_setup.sql` in your Supabase SQL editor.

2. **Configure Policies:**
   The setup script includes RLS policies for:
   - Users can upload to their own folders
   - Users can read/update/delete their own files
   - Public read access for course content

## File URLs

All uploaded files receive public URLs in the format:
```
https://your-project.supabase.co/storage/v1/object/public/wingman-files/{folder}/{userId}/{filename}
```

## Usage in Components

### DocumentUploader Component

```tsx
<DocumentUploader 
  userId="user-uuid"
  lessonId="lesson-uuid"
  topicId="topic-uuid"
  onFileUploaded={(file) => {
    console.log('File uploaded:', file.url);
  }}
/>
```

### Course Creator

The course creator automatically uses the new Supabase upload endpoint for all file uploads.

## Migration from Cloudinary

1. ✅ Removed Cloudinary package and environment variables
2. ✅ Created Supabase Storage API endpoint
3. ✅ Updated all upload components to use Supabase
4. ✅ Added support for DOCX files
5. ✅ Updated database schema to support new file types
6. ✅ Removed Cloudinary API routes and test pages

## Benefits of Supabase Storage

- **Cost Effective**: Lower storage costs compared to Cloudinary
- **Integrated**: Already using Supabase for database
- **Simple**: Direct file storage without transformation complexity
- **Secure**: Built-in RLS policies for access control
- **Scalable**: Backed by AWS S3 infrastructure

## Troubleshooting

### Upload Fails
1. Check Supabase credentials in environment variables
2. Verify bucket exists and is properly configured
3. Ensure RLS policies are set up correctly

### File Not Accessible
1. Verify bucket is public for the required files
2. Check file path structure matches expectations
3. Confirm user has proper permissions

### Large File Upload Issues
1. Files over 100MB are rejected
2. Consider implementing chunked uploads for very large files
3. Check browser and network timeout settings
