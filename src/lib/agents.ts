
export interface Agent {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Open Source' | 'Custom' | 'Unknown';
  systemPrompt: string;
}

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Balanced)',
    provider: 'OpenAI',
    systemPrompt: 'You are a balanced AI. Explain clearly, step-by-step when needed.',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Logic)',
    provider: 'Anthropic',
    systemPrompt: 'You are a logical tutor. Explain your reasoning process clearly and carefully. Always provide detailed, step-by-step explanations for your conclusions to help the user learn.',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V2 (Coding)',
    provider: 'Open Source',
    systemPrompt: 'You are a coding-focused assistant. You must provide clean, correct, and idiomatic code. Always explain the code and the choices you made.',
  },
  {
    id: 'togetherai:meta-llama/meta-llama-3.1-70b-instruct-turbo',
    name: 'Llama 3.1 70B (General)',
    provider: 'Open Source',
    systemPrompt: 'You are an open-source general AI. Be neutral, informative, and draw on a wide range of public knowledge.',
  },
];

    