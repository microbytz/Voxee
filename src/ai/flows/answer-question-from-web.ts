
'use server';
/**
 * @fileOverview A flow for answering user questions.
 */
import { config } from 'dotenv';
config();

import { ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { AnswerQuestionInput, AnswerQuestionOutput } from '@/lib/types';

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  personality: z.string().optional().describe('The AI personality to use.'),
  verbosity: z.string().optional().describe('The verbosity level of the AI.'),
  style: z.string().optional().describe('The writing style of the AI.'),
});

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});

ai.configure({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  logLevel: 'debug',
  enableTracing: true,
});

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: { schema: AnswerQuestionInputSchema },
  output: { schema: AnswerQuestionOutputSchema },
  prompt: `You are an AI assistant named Voxee. Your goal is to provide helpful and accurate answers to user questions.

  Adhere to the following persona settings for your response:
  - Personality: {{{personality}}}
  - Verbosity: {{{verbosity}}}
  - Style: {{{style}}}

  User's question:
  "{{{question}}}"

  Your answer:`,
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await answerQuestionPrompt(input);
    return output!;
  }
);

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return await answerQuestionFlow(input);
}
