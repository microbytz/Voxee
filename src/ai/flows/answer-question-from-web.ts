'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering questions based on real-time information retrieved from the web.
 *
 * - answerQuestionFromWeb - A function that handles the question answering process using web search.
 * - AnswerQuestionFromWebInput - The input type for the answerQuestionFromWeb function.
 * - AnswerQuestionFromWebOutput - The return type for the answerQuestionFromWeb function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionFromWebInputSchema = z.object({
  question: z.string().describe('The question to answer using web search.'),
});
export type AnswerQuestionFromWebInput = z.infer<typeof AnswerQuestionFromWebInputSchema>;

const AnswerQuestionFromWebOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on web search results.'),
});
export type AnswerQuestionFromWebOutput = z.infer<typeof AnswerQuestionFromWebOutputSchema>;

export async function answerQuestionFromWeb(input: AnswerQuestionFromWebInput): Promise<AnswerQuestionFromWebOutput> {
  return answerQuestionFromWebFlow(input);
}

const answerQuestionFromWebFlow = ai.defineFlow(
  {
    name: 'answerQuestionFromWebFlow',
    inputSchema: AnswerQuestionFromWebInputSchema,
    outputSchema: AnswerQuestionFromWebOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      prompt: `You are a helpful AI assistant. Answer the following question. If you need to search the web to answer, do so.

      Question: ${input.question}
      `,
    });

    return {
      answer: llmResponse.text,
    };
  }
);
