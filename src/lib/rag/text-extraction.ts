import mammoth from 'mammoth';
import JSZip from 'jszip';

// pdf2json type definitions
interface PDFTextRun {
  T: string;
}

interface PDFText {
  R: PDFTextRun[];
}

interface PDFPage {
  Texts: PDFText[];
}

interface PDFData {
  Pages: PDFPage[];
}

export interface ExtractedText {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

/**
 * Extract text from PDF buffer using pdf2json
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedText> {
  try {
    console.log('📄 Starting PDF text extraction with pdf2json...');
    console.log(`📏 Buffer size: ${buffer.length} bytes`);
    console.log(`🔍 Buffer type: ${typeof buffer}, isBuffer: ${Buffer.isBuffer(buffer)}`);
    
    // Ensure we have a valid Node Buffer
    if (!Buffer.isBuffer(buffer)) {
      console.log('🔄 Converting to Buffer...');
      buffer = Buffer.from(buffer);
    }
    
    if (buffer.length === 0) {
      throw new Error('Empty buffer provided');
    }
    
    // Import pdf2json dynamically
    const PDFParser = (await import('pdf2json')).default;
    
    console.log('📦 pdf2json loaded, processing buffer...');
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      // Handle successful parsing
      pdfParser.on('pdfParser_dataReady', (pdfData: PDFData) => {
        try {
          console.log(`📖 PDF loaded. Pages: ${pdfData.Pages?.length || 0}`);
          
          let fullText = '';
          let pageCount = 0;
          
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            pageCount = pdfData.Pages.length;
            
            // Extract text from each page
            for (let i = 0; i < pdfData.Pages.length; i++) {
              const page = pdfData.Pages[i];
              const pageTexts: string[] = [];
              
              if (page.Texts && Array.isArray(page.Texts)) {
                for (const textItem of page.Texts) {
                  if (textItem.R && Array.isArray(textItem.R)) {
                    for (const run of textItem.R) {
                      if (run.T) {
                        // Decode URI component (pdf2json encodes text)
                        const decodedText = decodeURIComponent(run.T);
                        pageTexts.push(decodedText);
                      }
                    }
                  }
                }
              }
              
              const pageText = pageTexts.join(' ').trim();
              if (pageText) {
                fullText += pageText + '\n';
              }
              
              console.log(`📄 Page ${i + 1}: extracted ${pageText.length} characters`);
            }
          }
          
          fullText = fullText.trim();
          console.log(`✅ PDF parsed successfully. Pages: ${pageCount}, Text length: ${fullText.length}`);
          
          resolve({
            text: fullText,
            metadata: {
              pageCount: pageCount,
              wordCount: fullText.split(/\s+/).length
            }
          });
        } catch (error) {
          console.error('❌ Error processing PDF data:', error);
          reject(new Error(`Failed to process PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
      
      // Handle parsing errors
      pdfParser.on('pdfParser_dataError', (error: Record<'parserError', Error>) => {
        console.error('❌ PDF parsing error:', error);
        reject(new Error(`PDF parsing failed: ${error?.parserError?.message || 'Unknown parsing error'}`));
      });
      
      // Parse the buffer
      try {
        pdfParser.parseBuffer(buffer);
      } catch (error) {
        console.error('❌ Error initiating PDF parsing:', error);
        reject(new Error(`Failed to initiate PDF parsing: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  } catch (error) {
    console.error('❌ PDF extraction failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bufferLength: buffer?.length ?? 'undefined'
    });
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
 * Extract text from PPTX buffer using JSZip and regex
 */
export async function extractTextFromPptx(buffer: Buffer): Promise<ExtractedText> {
  try {
    console.log('📎 Starting PPTX text extraction...');
    
    // Load PPTX file as ZIP archive
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(buffer);
    
    // PPTX slides are stored in ppt/slides/ directory
    const slideFiles = Object.keys(zipContent.files).filter(filename => 
      filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );
    
    console.log(`📋 Found ${slideFiles.length} slides in PPTX file`);
    
    const allTexts: string[] = [];
    
    // Process each slide
    for (const slideFile of slideFiles) {
      const slideXml = await zipContent.files[slideFile].async('text');
      
      // Extract text using regex - looks for <a:t> tags which contain text content
      const matches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
      
      console.log(`📄 Slide ${slideFile}: found ${matches.length} text elements`);
      
      for (const match of matches) {
        // Extract the text content between the tags
        const textContent = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '');
        if (textContent.trim()) {
          // Decode common HTML entities
          const decodedText = textContent
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          
          if (decodedText) {
            allTexts.push(decodedText);
          }
        }
      }
    }
    
    const text = allTexts.join(' ').trim();
    console.log(`✅ PPTX extraction complete. Extracted ${text.length} characters`);
    
    return {
      text,
      metadata: {
        wordCount: text ? text.split(/\s+/).length : 0
      }
    };
  } catch (error) {
    console.error('❌ PPTX extraction failed:', error);
    throw new Error(`Failed to extract text from PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
