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

export const AnswerQuestionFromWebInputSchema = z.object({
  question: z.string().describe('The question to answer using web search.'),
  personality: z.string().describe('The personality the AI should adopt.').optional(),
  verbosity: z.string().describe('How concise or verbose the answer should be.').optional(),
  style: z.string().describe('The writing style the AI should use.').optional(),
});
export type AnswerQuestionFromWebInput = z.infer<typeof AnswerQuestionFromWebInputSchema>;

export const AnswerQuestionFromWebOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on web search results.'),
});
export type AnswerQuestionFromWebOutput = z.infer<typeof AnswerQuestionFromWebOutputSchema>;


export const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionFromWebInputSchema},
  output: {schema: AnswerQuestionFromWebOutputSchema},
  tools: [google.googleSearch],
  prompt: `You are a helpful AI assistant. Your responses should be grounded in search results when possible.
  
  Your personality should be: {{{personality}}}
  Your verbosity should be: {{{verbosity}}}
  Your writing style should be: {{{style}}}

  Answer the following question. If you need to search the web to answer, do so using the provided tools.
  
  Question: {{{question}}}

  Your final answer must be a JSON object with a single key 'answer'.
  `,
});
