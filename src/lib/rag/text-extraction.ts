import mammoth from 'mammoth';

export interface ExtractedText {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedText> {
  try {
    // Dynamic import to avoid bundling test files during build
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length
      }
    };
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<ExtractedText> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length
      }
    };
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PPTX buffer (basic text extraction)
 */
export async function extractTextFromPptx(buffer: Buffer): Promise<ExtractedText> {
  try {
    // For PPTX, we'll use mammoth which can handle some PowerPoint files
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length
      }
    };
  } catch (error) {
    // Fallback: return empty text if PPTX extraction fails
    console.warn('PPTX extraction failed, returning empty text:', error);
    return {
      text: '',
      metadata: {
        wordCount: 0
      }
    };
  }
}

/**
 * Extract text based on file type
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<ExtractedText> {
  switch (mimeType) {
    case 'application/pdf':
      return extractTextFromPdf(buffer);
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return extractTextFromDocx(buffer);
    
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.slideshow':
      return extractTextFromPptx(buffer);
    
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
