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

// These types are used by client components and must be defined in a client-safe file.
export interface AnswerQuestionInput {
  question: string;
  personality?: string;
  verbosity?: string;
  style?: string;
}

export interface AnswerQuestionOutput {
  answer: string;
}
