import mammoth from "mammoth";
import JSZip from "jszip";

export interface ExtractedText {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

export interface PagedText {
  pages: Array<{
    pageNumber: number;
    text: string;
    startPosition: number;
    endPosition: number;
  }>;
  fullText: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

/**
 * Extract text from PDF buffer using pdf2json
 */
export async function extractTextFromPdf(
  buffer: Buffer
): Promise<ExtractedText> {
  try {
    // Dynamic import to avoid bundling issues
    const PDFParser =
      (await import("pdf2json")).default || (await import("pdf2json"));

    return new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as unknown as new () => {
        on(event: string, callback: (data: unknown) => void): void;
        parseBuffer(buffer: Buffer): void;
      })();

      pdfParser.on("pdfParser_dataReady", (pdfData: unknown) => {
        try {
          let extractedText = "";
          let pageCount = 0;

          const data = pdfData as {
            Pages?: Array<{
              Texts?: Array<{
                R?: Array<{
                  T?: string;
                }>;
              }>;
            }>;
          };

          if (data.Pages) {
            pageCount = data.Pages.length;

            for (const page of data.Pages) {
              if (page.Texts) {
                for (const textElement of page.Texts) {
                  if (textElement.R) {
                    for (const textRun of textElement.R) {
                      if (textRun.T) {
                        // Decode URI component as pdf2json returns encoded text
                        extractedText += decodeURIComponent(textRun.T) + " ";
                      }
                    }
                  }
                }
              }
              extractedText += "\n"; // Add line break between pages
            }
          }

          resolve({
            text: extractedText.trim(),
            metadata: {
              pageCount,
              wordCount: extractedText.trim().split(/\s+/).length,
            },
          });
        } catch (error) {
          reject(
            new Error(
              `Failed to process PDF data: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            )
          );
        }
      });

      pdfParser.on("pdfParser_dataError", (errMsg: unknown) => {
        const error = (errMsg as { parserError?: Error }) || errMsg;
        const errorMessage = error.parserError?.message || "Unknown error";
        reject(new Error(`PDF parsing failed: ${errorMessage}`));
      });

      // Parse the buffer
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extract text from PDF buffer with page tracking
 */
export async function extractPagedTextFromPdf(
  buffer: Buffer
): Promise<PagedText> {
  try {
    // Dynamic import to avoid bundling issues
    const PDFParser =
      (await import("pdf2json")).default || (await import("pdf2json"));

    return new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as unknown as new () => {
        on(event: string, callback: (data: unknown) => void): void;
        parseBuffer(buffer: Buffer): void;
      })();

      pdfParser.on("pdfParser_dataReady", (pdfData: unknown) => {
        try {
          const pages: Array<{
            pageNumber: number;
            text: string;
            startPosition: number;
            endPosition: number;
          }> = [];

          let fullText = "";
          let currentPosition = 0;

          const data = pdfData as {
            Pages?: Array<{
              Texts?: Array<{
                R?: Array<{
                  T?: string;
                }>;
              }>;
            }>;
          };

          if (data.Pages) {
            for (
              let pageIndex = 0;
              pageIndex < data.Pages.length;
              pageIndex++
            ) {
              const page = data.Pages[pageIndex];
              let pageText = "";

              if (page.Texts) {
                for (const textElement of page.Texts) {
                  if (textElement.R) {
                    for (const textRun of textElement.R) {
                      if (textRun.T) {
                        // Decode URI component as pdf2json returns encoded text
                        pageText += decodeURIComponent(textRun.T) + " ";
                      }
                    }
                  }
                }
              }

              pageText = pageText.trim();
              const startPosition = currentPosition;
              const endPosition = currentPosition + pageText.length;

              pages.push({
                pageNumber: pageIndex + 1,
                text: pageText,
                startPosition,
                endPosition,
              });

              fullText += pageText + "\n";
              currentPosition = endPosition + 1; // +1 for the newline
            }
          }

          resolve({
            pages,
            fullText: fullText.trim(),
            metadata: {
              pageCount: pages.length,
              wordCount: fullText.trim().split(/\s+/).length,
            },
          });
        } catch (error) {
          reject(
            new Error(
              `Failed to process PDF data: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            )
          );
        }
      });

      pdfParser.on("pdfParser_dataError", (errMsg: unknown) => {
        const error = (errMsg as { parserError?: Error }) || errMsg;
        const errorMessage = error.parserError?.message || "Unknown error";
        reject(new Error(`PDF parsing failed: ${errorMessage}`));
      });

      // Parse the buffer
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    throw new Error(
      `Failed to extract paged text from PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function extractTextFromDocx(
  buffer: Buffer
): Promise<ExtractedText> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to extract text from DOCX: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extract text from PPTX buffer using regex to parse XML content
 */
export async function extractTextFromPptx(
  buffer: Buffer
): Promise<ExtractedText> {
  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(buffer);

    let extractedText = "";
    let slideCount = 0;

    // Get all slide files (slide1.xml, slide2.xml, etc.)
    const slideFiles = Object.keys(zipContent.files).filter((filename) =>
      filename.match(/^ppt\/slides\/slide\d+\.xml$/)
    );

    slideCount = slideFiles.length;

    for (const slideFile of slideFiles) {
      const slideXml = await zipContent.files[slideFile].async("text");

      // Use regex to extract text content from XML
      // This regex matches text content within <a:t> tags (PowerPoint text elements)
      const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);

      if (textMatches) {
        for (const match of textMatches) {
          // Extract the text content and decode XML entities
          const textContent = match
            .replace(/<a:t[^>]*>(.*?)<\/a:t>/, "$1")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");

          extractedText += textContent + " ";
        }
      }

      // Also check for text in <a:p> (paragraph) tags
      const paragraphMatches = slideXml.match(/<a:p[^>]*>[\s\S]*?<\/a:p>/g);
      if (paragraphMatches) {
        for (const paragraph of paragraphMatches) {
          const innerTextMatches = paragraph.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
          if (innerTextMatches) {
            for (const innerMatch of innerTextMatches) {
              const textContent = innerMatch
                .replace(/<a:t[^>]*>(.*?)<\/a:t>/, "$1")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'");

              extractedText += textContent + " ";
            }
          }
        }
      }

      extractedText += "\n"; // Add line break between slides
    }

    return {
      text: extractedText.trim(),
      metadata: {
        pageCount: slideCount,
        wordCount: extractedText.trim().split(/\s+/).length,
      },
    };
  } catch (error) {
    console.warn("PPTX extraction failed:", error);
    return {
      text: "",
      metadata: {
        pageCount: 0,
        wordCount: 0,
      },
    };
  }
}

/**
 * Extract text based on file type
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedText> {
  switch (mimeType) {
    case "application/pdf":
      return extractTextFromPdf(buffer);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
      return extractTextFromDocx(buffer);

    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.slideshow":
      return extractTextFromPptx(buffer);

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
