
'use server';
/**
 * @fileOverview A flow for generating code from a description.
 */
import { config } from 'dotenv';
config();

import { ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { GenerateCodeInput, GenerateCodeOutput } from '@/lib/types';

const GenerateCodeInputSchema = z.object({
  description: z.string().describe('A description of the code to generate.'),
  language: z.string().describe('The programming language for the code.'),
});

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated code.'),
});

ai.configure({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  logLevel: 'debug',
  enableTracing: true,
});

const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: { schema: GenerateCodeInputSchema },
  output: { schema: GenerateCodeOutputSchema },
  prompt: `You are a highly skilled programmer. Generate a block of code in {{{language}}} that matches the following description.
  Only output the raw code, without any markdown formatting or explanations.

  Description: "{{{description}}}"
  `,
});

const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async (input) => {
    const { output } = await generateCodePrompt(input);
    return output!;
  }
);

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return await generateCodeFlow(input);
}
