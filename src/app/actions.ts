"use server";

import { answerQuestionFromWeb } from "@/ai/flows/answer-question-from-web";
import { generateCode } from "@/ai/flows/generate-code-from-description";
import { generateImageFromDescription } from "@/ai/flows/generate-image-from-description";
import { summarizeUploadedDocument } from "@/ai/flows/summarize-uploaded-document";
import type { AiResponse, Settings } from "@/lib/types";

interface HandleUserRequestInput {
  message: string;
  fileDataUri?: string;
  settings: Settings;
}

export async function handleUserRequest(input: HandleUserRequestInput): Promise<AiResponse> {
  try {
    if (input.fileDataUri) {
      const result = await summarizeUploadedDocument({ documentDataUri: input.fileDataUri });
      return {
        type: 'summary',
        content: result.summary,
      };
    }

    if (input.message.toLowerCase().startsWith("/imagine ")) {
      const description = input.message.substring(8).trim();
      const result = await generateImageFromDescription({ imageDescription: description });
      return {
        type: 'image',
        content: result.image,
      };
    }

    if (input.message.toLowerCase().startsWith("/code ")) {
      const parts = input.message.substring(5).trim().split(" ");
      const language = parts[0];
      const description = parts.slice(1).join(" ");

      if (!language || !description) {
        return {
          type: 'text',
          content: "Please provide a language and a description for the code you want to generate. Format: /code <language> <description>",
        };
      }

      const result = await generateCode({ language, description });
      return {
        type: 'code',
        content: result.code,
        codeLanguage: language,
      };
    }

    const result = await answerQuestionFromWeb({ 
      question: input.message,
      personality: input.settings.personality || 'default',
      verbosity: input.settings.verbosity || 'default',
      style: input.settings.style || 'casual',
     });
    return {
      type: 'text',
      content: result.answer,
    };
  } catch (error) {
    console.error("AI action failed:", error);
    return {
      type: 'text',
      content: "I'm sorry, I encountered an error while processing your request. Please try again.",
      error: (error as Error).message || "Unknown error",
    };
  }
}
