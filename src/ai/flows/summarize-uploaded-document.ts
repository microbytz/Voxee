
'use server';
/**
 * @fileOverview A flow for summarizing an uploaded document.
 */
import { config } from 'dotenv';
config();

import { genkit, ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit/zod';
import { SummarizeUploadedDocumentInput, SummarizeUploadedDocumentOutput } from '@/lib/types';

const SummarizeDocumentInputSchema = z.object({
  documentDataUri: z.string().describe("A document to summarize, as a data URI."),
});

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('The summary of the document.'),
});

genkit.configure({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  logLevel: 'debug',
  enableTracing: true,
});

const summarizeDocumentPrompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: { schema: SummarizeDocumentInputSchema },
  output: { schema: SummarizeDocumentOutputSchema },
  prompt: `Summarize the following document in a few concise paragraphs.

  Document:
  {{media url=documentDataUri}}
  `,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeDocumentPrompt(input);
    return output!;
  }
);

export async function summarizeDocument(input: SummarizeUploadedDocumentInput): Promise<SummarizeUploadedDocumentOutput> {
  return await summarizeDocumentFlow(input);
}
