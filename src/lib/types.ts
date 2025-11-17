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

// These types are derived from the Zod schemas in the flow files.
// Keeping them here allows client components to be aware of the data shape
// without needing to import server-only code.
export interface AnswerQuestionInput {
  question: string;
  personality?: string;
  verbosity?: string;
  style?: string;
}

export interface AnswerQuestionOutput {
  answer: string;
}

export interface GenerateCodeInput {
  description: string;
  language: string;
}

export interface GenerateCodeOutput {
  code: string;
}

export interface GenerateImageFromDescriptionInput {
  imageDescription: string;
}

export interface GenerateImageFromDescriptionOutput {
  image: string;
  progress: string;
}

export interface SummarizeUploadedDocumentInput {
  documentDataUri: string;
}

export interface SummarizeUploadedDocumentOutput {
  summary: string;
}
