'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering questions.
 *
 * - answerQuestion - A function that handles the question answering process.
 */
import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import type { AnswerQuestionInput, AnswerQuestionOutput } from '@/lib/types';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash-latest',
});

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  personality: z
    .string()
    .describe('The personality the AI should adopt.')
    .optional(),
  verbosity: z
    .string()
    .describe('How concise or verbose the answer should be.')
    .optional(),
  style: z
    .string()
    .describe('The writing style the AI should use.')
    .optional(),
});

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: { schema: AnswerQuestionInputSchema },
  output: { schema: AnswerQuestionOutputSchema },
  prompt: `You are a helpful AI assistant.
  
  Your personality should be: {{{personality}}}
  Your verbosity should be: {{{verbosity}}}
  Your writing style should be: {{{style}}}

  Answer the following question.
  
  Question: {{{question}}}

  Your final answer must be a JSON object with a single key 'answer'.
  `,
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await answerQuestionPrompt(input);
    if (!output) {
      throw new Error('The AI model failed to produce a valid response.');
    }
    return output;
  }
);

export async function answerQuestion(
  input: AnswerQuestionInput
): Promise<AnswerQuestionOutput> {
  return answerQuestionFlow(input);
}
