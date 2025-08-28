import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

// Utility function to extract video duration using ffprobe (requires ffmpeg)
function getVideoDuration(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath
    ]);

    let duration = '';
    ffprobe.stdout.on('data', (data) => {
      duration += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        const seconds = parseFloat(duration.trim());
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        if (hours > 0) {
          resolve(`${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`);
        } else {
          resolve(`${minutes}:${remainingSeconds.toString().padStart(2, '0')}`);
        }
      } else {
        reject(new Error('Failed to extract video duration'));
      }
    });

    ffprobe.on('error', (error) => {
      reject(error);
    });
  });
}

// Utility function to generate video thumbnail using ffmpeg
function generateVideoThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-ss', '00:00:02', // Seek to 2 seconds
      '-vframes', '1',
      '-y', // Overwrite output file
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Failed to generate thumbnail'));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

// POST /api/process-file - Process uploaded file to extract metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, fileType } = body;

    if (!filePath || !fileType) {
      return NextResponse.json(
        { error: 'File path and type are required' },
        { status: 400 }
      );
    }

    const fullPath = path.join(process.cwd(), 'uploads', path.basename(filePath));
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    let metadata: Record<string, unknown> = {};

    if (fileType === 'video') {
      try {
        // Extract video duration
        const duration = await getVideoDuration(fullPath);
        metadata.duration = duration;

        // Generate thumbnail
        const thumbnailName = `thumb_${path.basename(filePath, path.extname(filePath))}.jpg`;
        const thumbnailPath = path.join(process.cwd(), 'uploads', thumbnailName);
        
        try {
          await generateVideoThumbnail(fullPath, thumbnailPath);
          metadata.thumbnail = `/uploads/${thumbnailName}`;
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
          metadata.thumbnail = null;
        }

      } catch (error) {
        console.error('Error processing video:', error);
        // Return basic metadata even if processing fails
        metadata = {
          duration: '00:00',
          thumbnail: null,
        };
      }
    } else if (fileType === 'pdf') {
      // For PDF processing, you would typically use pdf-parse or similar
      // This is a placeholder implementation
      try {
        const fileBuffer = await fs.readFile(fullPath);
        
        // Simple PDF page count extraction (very basic)
        const pdfString = fileBuffer.toString('latin1');
        const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g);
        const pageCount = pageMatches ? pageMatches.length : 1;

        metadata = {
          pageCount,
          size: fileBuffer.length,
        };
      } catch (error) {
        console.error('Error processing PDF:', error);
        metadata = {
          pageCount: 1,
          size: 0,
        };
      }
    }

    return NextResponse.json({
      success: true,
      metadata,
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}

// GET /api/process-file - Check processing status or get file info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    const fullPath = path.join(process.cwd(), 'uploads', path.basename(filePath));
    
    try {
      const stats = await fs.stat(fullPath);
      
      return NextResponse.json({
        success: true,
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      });
    } catch {
      return NextResponse.json({
        success: true,
        exists: false,
      });
    }

  } catch (error) {
    console.error('Error checking file:', error);
    return NextResponse.json(
      { error: 'Failed to check file' },
      { status: 500 }
    );
  }
}
