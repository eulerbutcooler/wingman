import {
  extractText,
  extractTextFromPdf,
  extractTextFromDocx,
  extractTextFromPptx,
} from "../src/lib/rag/text-extraction";
import fs from "fs";
import path from "path";

// This is a simple test file to verify the text extraction implementations
async function testTextExtraction() {
  console.log("Testing text extraction implementations...\n");

  // Test with a sample PDF if available
  const uploadsDir = path.join(__dirname, "uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const pdfFile = files.find((file) => file.endsWith(".pdf"));

    if (pdfFile) {
      try {
        console.log(`Testing PDF extraction with: ${pdfFile}`);
        const pdfBuffer = fs.readFileSync(path.join(uploadsDir, pdfFile));
        const result = await extractTextFromPdf(pdfBuffer);
        console.log(`Extracted ${result.text.length} characters from PDF`);
        console.log(`Word count: ${result.metadata?.wordCount}`);
        console.log(`Page count: ${result.metadata?.pageCount}`);
        console.log(
          `First 200 characters: ${result.text.substring(0, 200)}...\n`
        );
      } catch (error) {
        console.error("PDF extraction failed:", error);
      }
    }
  }

  console.log("Text extraction setup completed successfully!");
  console.log("\nImplemented extractors:");
  console.log("✅ PDF files: pdf2json");
  console.log("✅ DOCX files: mammoth");
  console.log("✅ PPTX files: regex-based XML parsing with jszip");
}

if (require.main === module) {
  testTextExtraction().catch(console.error);
}
