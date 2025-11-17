import {z} from 'genkit';

export type Message = {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  type: 'text' | 'image' | 'code' | 'summary';
  codeLanguage?: string;
  isTyping?: boolean;
};

export type AiPersonality = 'default' | 'creative' | 'technical';
export type AiVerbosity = 'concise' | 'default' | 'verbose';
export type AiStyle = 'formal' | 'casual' | 'humorous';

export type Settings = {
  voice: string;
  pitch: number;
  rate: number;
  personality: AiPersonality;
  verbosity: AiVerbosity;
  style: AiStyle;
  autoSpeak: boolean;
};

export type AiResponse = {
  content: string;
  type: 'text' | 'image' | 'code' | 'summary';
  codeLanguage?: string;
  error?: string;
}

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  personality: z.string().describe('The personality the AI should adopt.').optional(),
  verbosity: z.string().describe('How concise or verbose the answer should be.').optional(),
  style: z.string().describe('The writing style the AI should use.').optional(),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;
