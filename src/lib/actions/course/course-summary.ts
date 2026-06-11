"use server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function generateCourseSummary(
  title: string,
  description: string
): Promise<string> {
  try {
    const result = await generateText({
      model: google("gemini-3.1-flash-lite"),
      system: `You are "AeroMentor", a virtual teaching assistant for students at the Indian Naval Institute of Aeronautical Technology (NIAT). You help students understand aeronautical engineering and naval technology concepts. 

Your task is to generate a brief, encouraging summary for a course that helps NIAT students understand what they'll learn and how it relates to their field of study. Write in a supportive, friendly tone as if speaking directly to the student.

Keep the summary to 2-3 sentences and focus on the practical applications and relevance to aeronautical engineering or naval technology.`,
      prompt: `Generate a brief, encouraging summary for this course:
Title: ${title}
Description: ${description}

Write as Wingman, helping NIAT students understand the value and relevance of this course to their aeronautical engineering studies.`,
    });

    return result.text;
  } catch (error) {
    console.error("Error generating course summary:", error);
    return "This course will provide valuable insights to enhance your understanding of aeronautical engineering principles.";
  }
}
