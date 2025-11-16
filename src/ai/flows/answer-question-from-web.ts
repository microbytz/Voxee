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

const searchWeb = ai.defineTool(
  {
    name: 'searchWeb',
    description: 'Searches the web for the given query and returns the results.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.string(),
  },
  async input => {
    // This is a placeholder implementation. Replace with actual web search.
    // In a real application, you would use a search API like Google Search.
    // For this example, we'll just return a canned response.
    return `Search results for ${input.query}: This is a simulated search result.  Please replace with actual search implementation!`;
  }
);

const answerQuestionFromWebPrompt = ai.definePrompt({
  name: 'answerQuestionFromWebPrompt',
  input: {schema: AnswerQuestionFromWebInputSchema},
  output: {schema: AnswerQuestionFromWebOutputSchema},
  tools: [searchWeb],
  prompt: `You are an AI assistant that answers questions based on web search results.

  Use the searchWeb tool to find relevant information to answer the question.

  Question: {{{question}}}

  If you cannot find the answer using the search results, respond that you don't know.
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  }
});

const answerQuestionFromWebFlow = ai.defineFlow(
  {
    name: 'answerQuestionFromWebFlow',
    inputSchema: AnswerQuestionFromWebInputSchema,
    outputSchema: AnswerQuestionFromWebOutputSchema,
  },
  async input => {
    const {output} = await answerQuestionFromWebPrompt(input);
    return output!;
  }
);
