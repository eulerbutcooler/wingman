import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processDocumentJob } from "@/inngest/functions/process-document";

// Export the Inngest serve handler
// This creates GET, POST, PUT endpoints that Inngest uses to trigger functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processDocumentJob, // Register the document processing function
  ],
});
