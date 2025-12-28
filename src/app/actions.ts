
'use server';
import { config } from 'dotenv';
config();

import type { AiResponse, Settings } from '@/lib/types';
import { answerQuestion } from '@/ai/flows/answer-question-from-web';
import { generateCode } from '@/ai/flows/generate-code-from-description';
import { generateImage } from '@/ai/flows/generate-image-from-description';
import { summarizeDocument } from '@/ai/flows/summarize-uploaded-document';

interface HandleUserRequestProps {
    message: string;
    fileDataUri?: string;
    settings: Settings;
}

export async function handleUserRequest({ message, fileDataUri, settings }: HandleUserRequestProps): Promise<AiResponse> {
    try {
        if (fileDataUri) {
            if (fileDataUri.startsWith('data:image')) {
                // For this simple case, we'll assume image uploads are for a new "imagine" prompt
                 const response = await generateImage({ imageDescription: message || 'Create a beautiful image from this context', image: fileDataUri });
                 return { type: 'image', content: response.image };
            } else {
                const response = await summarizeDocument({ documentDataUri: fileDataUri });
                return { type: 'summary', content: response.summary };
            }
        }

        const trimmedMessage = message.trim();

        if (trimmedMessage.startsWith('/code')) {
            const description = trimmedMessage.substring(5).trim();
            const languageMatch = description.match(/(\w+)\s/);
            const language = languageMatch ? languageMatch[1] : 'javascript';
            const finalDescription = description.substring(language.length).trim();
            const response = await generateCode({ description: finalDescription, language });
            return { type: 'code', content: response.code, codeLanguage: language };
        }

        if (trimmedMessage.startsWith('/imagine')) {
            const imageDescription = trimmedMessage.substring(8).trim();
            const response = await generateImage({ imageDescription });
            return { type: 'image', content: response.image };
        }

        const { personality, verbosity, style } = settings;
        const response = await answerQuestion({ question: trimmedMessage, personality, verbosity, style });
        return { type: 'text', content: response.answer };

    } catch (e: any) {
        console.error("Error handling user request:", e);
        return {
            type: 'text',
            content: `I'm sorry, but I encountered an error: ${e.message}. Please check your configuration and try again.`,
            error: e.message,
        };
    }
}
