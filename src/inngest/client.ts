import { Inngest } from "inngest";

// Create the Inngest client
// This client is used to send events and create functions
export const inngest = new Inngest({
  id: "wingman-rag",
  name: "Wingman RAG Pipeline",
});
