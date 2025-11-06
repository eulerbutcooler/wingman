/**
 * Query Classification for RAG System (Issue 7)
 *
 * Classifies user queries to determine optimal retrieval strategy:
 * - LIST_ALL: Queries asking for comprehensive lists (need many chunks, lower threshold)
 * - EXPLAIN: Queries asking for specific explanations (need focused chunks, higher threshold)
 * - COMPARE: Queries comparing concepts (need targeted chunks from multiple sources)
 * - SEARCH: General search queries (balanced approach)
 */

export enum QueryType {
  LIST_ALL = "list_all", // "list all lesson plans", "show all topics"
  EXPLAIN = "explain", // "explain concept X", "what is Y"
  COMPARE = "compare", // "compare X and Y", "differences between"
  SEARCH = "search", // General queries
  TEACH = "teach", //For teaching stuff
}

export interface QueryClassification {
  type: QueryType;
  confidence: number;
  reasoning: string;
  suggestedTopK: number;
  suggestedThreshold: number;
  suggestedTemperature: number;
}

/**
 * Patterns for detecting LIST_ALL queries
 */
const LIST_PATTERNS = [
  /\b(list|show|display|give|provide|get)\s+(all|every|entire|complete)\b/i,
  /\b(all|every|entire)\s+(?:the\s+)?(lesson plans?|topics?|chapters?|sections?|modules?|files?|documents?)\b/i,
  /\bhow many\s+(lesson plans?|topics?|chapters?|sections?)\b/i,
  /\bwhat\s+(?:are\s+)?(?:all|every|the)\s+(?:the\s+)?(lesson plans?|topics?)\b/i,
];

/**
 * Patterns for detecting EXPLAIN queries
 */
const EXPLAIN_PATTERNS = [
  /\b(explain|describe|define|elaborate on|what is|tell me about|how does)\b/i,
  /\b(meaning|definition|concept|theory)\s+of\b/i,
  /\bwhy\s+(is|are|does|do)\b/i,
];

/**
 * Patterns for detecting COMPARE queries
 */
const COMPARE_PATTERNS = [
  /\b(compare|contrast|difference|distinguish|vs|versus)\b/i,
  /\bbetween\s+.+\s+and\s+/i,
  /\b(similar|different)\s+(to|from|than)\b/i,
];

/**
 * Keywords indicating comprehensive retrieval needs
 */
const COMPREHENSIVE_KEYWORDS = [
  "all",
  "every",
  "entire",
  "complete",
  "comprehensive",
  "full",
  "total",
  "whole",
  "overview",
  "summary",
];

const TEACH_PATTERNS = [
  /\b(teach|learn|study|understand|master|grasp)\s+(me|how to|about)\b/i,
  /\b(help me|show me how|guide me|walk me through)\b/i,
  /\b(tutorial|lesson|course|training)\s+(?:on|about|for)\b/i,
  /\bhow\s+(?:do I|can I|to)\s+(learn|study|understand|practice)\b/i,
  /\bi\s+(want to|need to|would like to)\s+(learn|study|understand|master)\b/i,
  /\b(beginner|start|getting started|introduction)\s+(?:to|with)\b/i,
  /\bstep[- ]by[- ]step\b/i,
];

/**
 * Keywords indicating teaching/learning intent
 */
const TEACHING_KEYWORDS = [
  "teach",
  "learn",
  "study",
  "tutorial",
  "guide",
  "lesson",
  "practice",
  "exercise",
  "beginner",
  "basics",
  "fundamentals",
  "introduction",
  "training",
  "master",
  "understand",
  "grasp",
  "step-by-step",
  "walkthrough",
  "course",
];

/**
 * Classifies a query and provides optimal retrieval parameters
 */
export function classifyQuery(query: string): QueryClassification {
  const lowerQuery = query.toLowerCase();

  // Check for LIST_ALL patterns (highest priority)
  for (const pattern of LIST_PATTERNS) {
    if (pattern.test(query)) {
      // Check for comprehensive keywords to boost confidence
      const hasComprehensiveKeyword = COMPREHENSIVE_KEYWORDS.some((keyword) =>
        lowerQuery.includes(keyword)
      );

      return {
        type: QueryType.LIST_ALL,
        confidence: hasComprehensiveKeyword ? 0.95 : 0.85,
        reasoning: "Query asks for a comprehensive list of items",
        suggestedTopK: 50, // Retrieve many chunks for comprehensive coverage
        suggestedThreshold: 0.4, // LOWERED to 0.4 to catch all relevant items
        suggestedTemperature: 0, // Deterministic for consistent listings
      };
    }
  }

  // Check for COMPARE patterns
  for (const pattern of COMPARE_PATTERNS) {
    if (pattern.test(query)) {
      return {
        type: QueryType.COMPARE,
        confidence: 0.85,
        reasoning: "Query asks to compare or contrast concepts",
        suggestedTopK: 15, // Need chunks from multiple sources
        suggestedThreshold: 0.5, // LOWERED for better recall
        suggestedTemperature: 0.3, // Low creativity for structured comparison
      };
    }
  }

  // Check for EXPLAIN patterns
  for (const pattern of EXPLAIN_PATTERNS) {
    if (pattern.test(query)) {
      return {
        type: QueryType.EXPLAIN,
        confidence: 0.9,
        reasoning: "Query asks for explanation or definition",
        suggestedTopK: 8, // Focused retrieval
        suggestedThreshold: 0.5, // LOWERED for better recall
        suggestedTemperature: 0.6, // Moderate creativity for varied explanations
      };
    }
  }

  // Check for TEACH patterns (before EXPLAIN to avoid overlap)
  for (const pattern of TEACH_PATTERNS) {
    if (pattern.test(query)) {
      const hasTeachingKeyword = TEACHING_KEYWORDS.some((keyword) =>
        lowerQuery.includes(keyword)
      );

      return {
        type: QueryType.TEACH,
        confidence: hasTeachingKeyword ? 0.95 : 0.85,
        reasoning: "Query asks for teaching or learning guidance",
        suggestedTopK: 20,
        suggestedThreshold: 0.45,
        suggestedTemperature: 0.7, // Higher creativity for teaching approaches
      };
    }
  }

  // Default to SEARCH
  // Check if query has comprehensive intent even without explicit patterns
  const comprehensiveScore = COMPREHENSIVE_KEYWORDS.reduce((score, keyword) => {
    return lowerQuery.includes(keyword) ? score + 0.15 : score;
  }, 0);

  if (comprehensiveScore > 0.3) {
    return {
      type: QueryType.LIST_ALL,
      confidence: 0.7,
      reasoning: "Query suggests comprehensive information needs",
      suggestedTopK: 30,
      suggestedThreshold: 0.4, // LOWERED for better recall
      suggestedTemperature: 0, // Deterministic for consistent listings
    };
  }

  return {
    type: QueryType.SEARCH,
    confidence: 0.7,
    reasoning: "General search query",
    suggestedTopK: 10, // Balanced retrieval
    suggestedThreshold: 0.4, // LOWERED to match default
    suggestedTemperature: 0.5, // Balanced temperature
  };
}

/**
 * Get query-specific LLM prompt (Issue 11)
 */
export function getQuerySpecificPrompt(classification: QueryClassification): {
  systemAddition: string;
  userAddition: string;
} {
  switch (classification.type) {
    case QueryType.LIST_ALL:
      return {
        systemAddition: `
IMPORTANT: This is a LIST_ALL query. The user wants a COMPREHENSIVE list.
- List ALL relevant items found in the context, even if there are many
- Use bullet points or numbered lists for clarity
- Include brief descriptions for each item if available
- If sources mention the same item, avoid duplication but note it
- If the list seems incomplete, explicitly state that these are the items found in the available context`,
        userAddition:
          "\n\nPlease provide a COMPLETE list of all relevant items, not just a few examples.",
      };

    case QueryType.EXPLAIN:
      return {
        systemAddition: `
IMPORTANT: This is an EXPLAIN query. Focus on providing a clear, detailed explanation.
- Provide step-by-step explanations when appropriate
- Use examples from the context to illustrate concepts
- Define key terms
- Be thorough but organized`,
        userAddition:
          "\n\nPlease provide a comprehensive explanation with examples.",
      };

    case QueryType.COMPARE:
      return {
        systemAddition: `
IMPORTANT: This is a COMPARE query. Structure your response to highlight similarities and differences.
- Use a structured format (e.g., "Similarities:", "Differences:")
- Be balanced in covering both items being compared
- Cite sources for each point of comparison`,
        userAddition: "\n\nPlease provide a structured comparison.",
      };

    case QueryType.TEACH:
      return {
        systemAddition: `
IMPORTANT: This is a TEACH query. The user wants to learn or understand something.
- Break down complex concepts into simple, digestible parts
- Use a pedagogical approach with progressive difficulty
- Provide examples, analogies, and practice exercises when available
- Structure the response with clear learning objectives
- Include foundational concepts before advanced ones
- Encourage active learning with questions or exercises`,
        userAddition:
          "\n\nPlease teach this concept in a clear, step-by-step manner with examples.",
      };

    case QueryType.SEARCH:
    default:
      return {
        systemAddition: "",
        userAddition: "",
      };
  }
}
