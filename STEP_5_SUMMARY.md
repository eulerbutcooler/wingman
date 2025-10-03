# Step 5: File Status Polling API

## What We Created

### 1. Status API Endpoint
**File:** `/src/app/api/files/status/route.ts`

**Endpoints:**
- `GET /api/files/status?fileId=xxx` - Check single file
- `GET /api/files/status?fileIds=xxx,yyy,zzz` - Check multiple files

**Response for Single File:**
```json
{
  "success": true,
  "fileId": "abc-123",
  "fileName": "document.pdf",
  "status": "completed",
  "error": null,
  "chunkCount": 42,
  "isComplete": true,
  "isFailed": false,
  "isProcessing": false
}
```

**Response for Multiple Files:**
```json
{
  "success": true,
  "files": [...],
  "summary": {
    "total": 10,
    "pending": 2,
    "processing": 3,
    "completed": 4,
    "failed": 1,
    "allComplete": false,
    "anyFailed": true
  }
}
```

### 2. Service Functions
**File:** `/src/services/course-service.ts`

**Added Functions:**
- `getFileStatus(fileId)` - Check single file status
- `getBatchFileStatus(fileIds)` - Check multiple files status
- `pollFileStatus(fileIds, options)` - Poll until complete

## Usage Examples

### Example 1: Check Single File Status
```typescript
import { getFileStatus } from "@/services/course-service";

const status = await getFileStatus("file-id-123");
console.log(`Status: ${status.status}`);
console.log(`Chunks: ${status.chunkCount}`);
```

### Example 2: Check Multiple Files
```typescript
import { getBatchFileStatus } from "@/services/course-service";

const fileIds = ["file-1", "file-2", "file-3"];
const status = await getBatchFileStatus(fileIds);

console.log(`Total: ${status.summary.total}`);
console.log(`Completed: ${status.summary.completed}`);
console.log(`All done? ${status.summary.allComplete}`);
```

### Example 3: Poll Until Complete (with Progress)
```typescript
import { pollFileStatus } from "@/services/course-service";

const fileIds = ["file-1", "file-2", "file-3"];

const finalStatus = await pollFileStatus(fileIds, {
  maxAttempts: 60,      // Max 60 attempts
  intervalMs: 5000,     // Check every 5 seconds
  onProgress: (status) => {
    console.log(`Progress: ${status.summary.completed}/${status.summary.total} complete`);
    
    // Update UI
    setProcessingStatus(status);
  }
});

if (finalStatus.summary.allComplete) {
  console.log("✅ All files processed!");
} else {
  console.log("⚠️ Some files still processing or failed");
}
```

## Integration with CourseCreator

You can add this after file upload in `CourseCreator.tsx`:

```typescript
// After successful parallel upload
const uploadedFileIds = results
  .filter(r => r.status === "fulfilled")
  .map(r => r.value.id);

// Start polling
pollFileStatus(uploadedFileIds, {
  maxAttempts: 60,
  intervalMs: 5000,
  onProgress: (status) => {
    // Update UI with processing progress
    console.log(`RAG Processing: ${status.summary.completed}/${status.summary.total}`);
  }
}).then((finalStatus) => {
  if (finalStatus.summary.allComplete) {
    alert("All files processed! You can now use the chat feature.");
  }
});
```

## Status Flow

```
Upload File → "pending"
              ↓
          Inngest picks up job
              ↓
          "processing"
              ↓
        Extract → Chunk → Embed → Store
              ↓
          "completed" (success)
              or
          "failed" (with error message)
```

## API Statuses

- **pending** - File uploaded, waiting for processing
- **processing** - Currently extracting/chunking/embedding
- **completed** - Successfully processed, ready for RAG queries
- **failed** - Processing failed (see error field)

## Benefits

✅ **Real-time tracking** - Know exactly when files are ready
✅ **User feedback** - Show progress to users
✅ **Error detection** - Catch and display processing failures
✅ **Batch monitoring** - Check multiple files at once
✅ **Smart polling** - Automatic retry with configurable intervals
