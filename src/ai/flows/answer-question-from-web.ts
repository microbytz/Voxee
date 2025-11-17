'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering questions based on real-time information retrieved from the web.
 *
 * - answerQuestionFromWeb - A function that handles the question answering process using web search.
 * - AnswerQuestionFromWebInput - The input type for the answerQuestionFromWeb function.
 * - AnswerQuestionFromWebOutput - The return type for the answerQuestionFromWeb function.
 */

import {ai} from '@/ai/genkit';
import {z, googleSearch} from 'genkit';

const AnswerQuestionFromWebInputSchema = z.object({
  question: z.string().describe('The question to answer using web search.'),
  personality: z.string().describe('The personality the AI should adopt.').optional(),
  verbosity: z.string().describe('How concise or verbose the answer should be.').optional(),
  style: z.string().describe('The writing style the AI should use.').optional(),
});
export type AnswerQuestionFromWebInput = z.infer<typeof AnswerQuestionFromWebInputSchema>;

const AnswerQuestionFromWebOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on web search results.'),
});
export type AnswerQuestionFromWebOutput = z.infer<typeof AnswerQuestionFromWebOutputSchema>;

export async function answerQuestionFromWeb(input: AnswerQuestionFromWebInput): Promise<AnswerQuestionFromWebOutput> {
  return answerQuestionFromWebFlow(input);
}

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionFromWebInputSchema},
  output: {schema: AnswerQuestionFromWebOutputSchema},
  tools: [googleSearch],
  prompt: `You are a helpful AI assistant. Your responses should be grounded in search results when possible.
  
  Your personality should be: {{{personality}}}
  Your verbosity should be: {{{verbosity}}}
  Your writing style should be: {{{style}}}

  Answer the following question. If you need to search the web to answer, do so using the provided tools.
  
  Question: {{{question}}}

  Your final answer must be a JSON object with a single key 'answer'.
  `,
});


const answerQuestionFromWebFlow = ai.defineFlow(
  {
    name: 'answerQuestionFromWebFlow',
    inputSchema: AnswerQuestionFromWebInputSchema,
    outputSchema: AnswerQuestionFromWebOutputSchema,
  },
  async input => {
    const {output} = await answerQuestionPrompt(input);
    if (!output) {
      throw new Error("The AI model failed to produce a valid response.");
    }
    return output;
  }
);
