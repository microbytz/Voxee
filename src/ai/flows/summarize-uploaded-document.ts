'use server';
/**
 * @fileOverview Summarizes an uploaded document.
 *
 * - summarizeUploadedDocument - A function that handles the summarization of the uploaded document.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {z} from 'genkit';
import type { SummarizeUploadedDocumentInput, SummarizeUploadedDocumentOutput } from '@/lib/types';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash-latest',
});

const SummarizeUploadedDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const SummarizeUploadedDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the document content.'),
});

export async function summarizeUploadedDocument(
  input: SummarizeUploadedDocumentInput
): Promise<SummarizeUploadedDocumentOutput> {
  return summarizeUploadedDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeUploadedDocumentPrompt',
  input: {schema: SummarizeUploadedDocumentInputSchema},
  output: {schema: SummarizeUploadedDocumentOutputSchema},
  prompt: `You are an expert summarizer.  Please provide a concise summary of the following document:

{{media url=documentDataUri}}`,
});

const summarizeUploadedDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeUploadedDocumentFlow',
    inputSchema: SummarizeUploadedDocumentInputSchema,
    outputSchema: SummarizeUploadedDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
