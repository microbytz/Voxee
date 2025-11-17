'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering questions.
 *
 * - answerQuestion - A function that handles the question answering process.
 */

import {ai, answerQuestionPrompt, type AnswerQuestionInput, type AnswerQuestionOutput} from '@/ai/genkit';


export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return answerQuestionFlow(input);
}

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInput,
    outputSchema: AnswerQuestionOutput,
  },
  async input => {
    const {output} = await answerQuestionPrompt(input);
    if (!output) {
      throw new Error("The AI model failed to produce a valid response.");
    }
    return output;
  }
);
