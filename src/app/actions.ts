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
    const errorMessage = (error as Error).message || "An unknown error occurred.";

    let userFriendlyMessage = `An error occurred: ${errorMessage}`;

    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
      userFriendlyMessage = "Error: Too many requests. You may have hit your API rate limit. Please check your API key and billing status.";
    } else if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('permissiondenied')) {
      userFriendlyMessage = "Error: Authentication failed. Please make sure your GEMINI_API_KEY is set correctly in the .env file and is valid.";
    } else if (errorMessage.toLowerCase().includes('flow failed')) {
        userFriendlyMessage = `Flow execution failed. This can happen if the AI model does not return a valid response. Raw error: ${errorMessage}`;
    }

    return {
      type: 'text',
      content: userFriendlyMessage,
      error: errorMessage,
    };
  }
}
