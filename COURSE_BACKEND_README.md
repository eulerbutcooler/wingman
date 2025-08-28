# Course Creation Backend Implementation

This comprehensive backend implementation provides a complete course creation system with PDF and video upload functionality.

## 🏗️ Architecture Overview

### Database Schema
- **courses**: Main course information
- **topics**: Course modules/sections  
- **lessons**: Individual lessons with file references
- **files**: File metadata and storage paths

### API Endpoints
- `POST /api/courses` - Create new course
- `GET /api/courses` - Fetch user courses
- `POST /api/topics` - Create new topic
- `GET /api/topics` - Fetch course topics
- `POST /api/lessons` - Create new lesson
- `GET /api/lessons` - Fetch topic lessons
- `POST /api/upload` - Upload files (PDF/Video)
- `POST /api/process-file` - Extract file metadata

## 📁 File Structure

```
src/
├── app/api/
│   ├── courses/route.ts          # Course CRUD operations
│   ├── topics/route.ts           # Topic management
│   ├── lessons/route.ts          # Lesson management
│   ├── upload/route.ts           # File upload handling
│   └── process-file/route.ts     # File processing (metadata)
├── lib/
│   ├── db/schema/courses.ts      # Database schema definitions
│   ├── services/course-service.ts # Client-side API interface
│   └── hooks/use-course-creator.ts # React hook for course creation
└── drizzle/migrations/
    └── courses.sql               # Database migration script
```

## 🚀 Setup Instructions

### 1. Database Setup
Run the migration script to create tables:
```sql
-- Execute the contents of drizzle/migrations/courses.sql
-- This creates courses, topics, lessons, and files tables
```

### 2. Environment Variables
Add to your `.env` file:
```env
# Already configured in your existing .env
DATABASE_URL=your_postgres_connection_string
```

### 3. Upload Directory
Create uploads directory for file storage:
```bash
mkdir -p uploads
```

### 4. Optional: FFmpeg Installation
For video processing (duration extraction, thumbnails):
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

## 🔧 API Usage Examples

### Creating a Course
```typescript
import { courseService } from '@/lib/services/course-service';

const newCourse = await courseService.createCourse({
  title: "My New Course",
  description: "Course description here",
  imageUrl: "https://example.com/image.jpg",
  userId: "user-uuid",
  topics: [
    {
      title: "Module 1",
      lessons: [
        {
          title: "Introduction Video",
          type: "video",
          fileUrl: "/uploads/video.mp4",
          duration: "10:30"
        }
      ]
    }
  ]
});
```

### Uploading Files
```typescript
const uploadedFile = await courseService.uploadFile(
  file, // File object
  userId,
  undefined, // lessonId (optional)
  (progress) => console.log(`Upload: ${progress}%`)
);
```

### Using the React Hook
```typescript
import { useCourseCreator } from '@/hooks/use-course-creator';

function CourseCreator() {
  const {
    courseData,
    addTopic,
    uploadFile,
    saveCourse,
    isLoading
  } = useCourseCreator({
    userId: "user-uuid",
    onSuccess: (course) => console.log('Course created:', course),
    onError: (error) => console.error('Error:', error)
  });

  // Use the hook methods to manage course creation
}
```

## 📋 Features

### ✅ File Upload
- **Supported Formats**: MP4, WebM, MOV, AVI (videos), PDF
- **Size Limit**: 100MB per file
- **Progress Tracking**: Real-time upload progress
- **Validation**: File type and size validation

### ✅ Video Processing
- **Duration Extraction**: Automatic video duration detection
- **Thumbnail Generation**: Auto-generate video thumbnails
- **Metadata**: Extract video resolution, format info

### ✅ PDF Processing
- **Page Count**: Extract number of pages
- **Size Info**: File size metadata
- **Text Extraction**: Ready for future search features

### ✅ Database Features
- **Relationships**: Proper foreign key constraints
- **Cascading Deletes**: Clean up related records
- **Indexing**: Optimized queries with proper indexes
- **Timestamps**: Auto-updated timestamps

### ✅ API Features
- **Error Handling**: Comprehensive error responses
- **Validation**: Input validation and sanitization
- **Transactions**: Database transaction support
- **File Management**: Organized file storage

## 🔐 Security Features

### File Validation
- File type checking (MIME type validation)
- File size limits (configurable)
- Malicious file detection
- Safe filename generation

### Database Security
- Parameterized queries (SQL injection prevention)
- User isolation (user-specific data access)
- Input sanitization
- Proper error handling (no data leakage)

## 📊 Database Schema Details

### Courses Table
```sql
id UUID PRIMARY KEY
title TEXT NOT NULL
description TEXT NOT NULL
image_url TEXT
user_id UUID REFERENCES users(id)
created_at, updated_at TIMESTAMPS
```

### Topics Table
```sql
id UUID PRIMARY KEY
title TEXT NOT NULL
course_id UUID REFERENCES courses(id) CASCADE
order INTEGER NOT NULL
created_at, updated_at TIMESTAMPS
```

### Lessons Table
```sql
id UUID PRIMARY KEY
title TEXT NOT NULL
type TEXT CHECK (video|pdf)
file_url TEXT
duration TEXT (for videos)
topic_id UUID REFERENCES topics(id) CASCADE
order INTEGER NOT NULL
created_at, updated_at TIMESTAMPS
```

### Files Table
```sql
id UUID PRIMARY KEY
original_name TEXT NOT NULL
filename TEXT NOT NULL (sanitized)
mime_type TEXT NOT NULL
size INTEGER NOT NULL
url TEXT NOT NULL
lesson_id UUID REFERENCES lessons(id) CASCADE
user_id UUID REFERENCES users(id)
created_at TIMESTAMP
```

## 🚀 Performance Optimizations

### Database Indexes
- User-based queries optimized
- Hierarchical data access optimized
- Order-based sorting optimized

### File Handling
- Efficient streaming for large files
- Progress tracking without blocking
- Chunked upload support (extensible)

### Caching Strategy
- File metadata caching ready
- Course data caching points identified
- CDN integration ready

## 🔄 Future Extensions

### Planned Features
1. **Cloud Storage**: AWS S3, Google Cloud integration
2. **Video Streaming**: HLS/DASH streaming support
3. **Content Security**: DRM, watermarking
4. **Analytics**: View tracking, completion rates
5. **Search**: Full-text search across content
6. **Versioning**: Course version management

### Integration Points
- Ready for CDN integration
- Prepared for cloud storage migration
- Extensible for real-time features
- Scalable for high-traffic scenarios

## 🧪 Testing

### API Testing
```bash
# Test course creation
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Course","description":"Test","userId":"user-id"}'

# Test file upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf" \
  -F "userId=user-id"
```

### Unit Testing Framework Ready
- API endpoint testing setup
- Database testing utilities
- File upload testing helpers
- Integration testing support

This backend provides a solid foundation for a comprehensive course creation and management system with robust file handling capabilities.
