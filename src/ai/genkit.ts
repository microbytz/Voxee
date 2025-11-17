'use server';

import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

// Initialize the googleAI plugin
export const google = googleAI();

// Configure Genkit with the googleAI plugin
export const ai = genkit({
  plugins: [google],
  model: 'googleai/gemini-1.5-flash-latest',
});

export const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  personality: z.string().describe('The personality the AI should adopt.').optional(),
  verbosity: z.string().describe('How concise or verbose the answer should be.').optional(),
  style: z.string().describe('The writing style the AI should use.').optional(),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

export const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are a helpful AI assistant.
  
  Your personality should be: {{{personality}}}
  Your verbosity should be: {{{verbosity}}}
  Your writing style should be: {{{style}}}

  Answer the following question.
  
  Question: {{{question}}}

  Your final answer must be a JSON object with a single key 'answer'.
  `,
});
