
export interface Agent {
  id: string; // unique ID for React keys and selection.
  name: string;
  provider: string; // 'Puter', 'OpenAI', 'Anthropic', 'Google', etc.
  model: string; // model id for the provider API ('gpt-4o-mini' for puter, 'gpt-4-turbo' for custom OpenAI)
  systemPrompt: string;
  apiKey?: string; // for custom
  isCustom?: boolean; // for custom
}

// All default agents are from Puter
export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'puter-gpt-4o-mini', // New unique ID
    name: 'GPT-4o Mini (Balanced)',
    provider: 'Puter', // Explicitly Puter
    model: 'gpt-4o-mini', // The model ID for puter.ai.chat
    systemPrompt: 'You are a balanced AI. Explain clearly, step-by-step when needed.',
  },
  {
    id: 'puter-claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Logic)',
    provider: 'Puter',
    model: 'anthropic/claude-3.5-sonnet',
    systemPrompt: 'You are a logical tutor. Explain your reasoning process clearly and carefully. Always provide detailed, step-by-step explanations for your conclusions to help the user learn.',
  },
  {
    id: 'puter-deepseek-chat',
    name: 'DeepSeek V2 (Coding)',
    provider: 'Puter',
    model: 'deepseek-chat',
    systemPrompt: 'You are a coding-focused assistant. You must provide clean, correct, and idiomatic code. Always explain the code and the choices you made.',
  },
  {
    id: 'puter-llama-3.1-70b',
    name: 'Llama 3.1 70B (General)',
    provider: 'Puter',
    model: 'togetherai:meta-llama/meta-llama-3.1-70b-instruct-turbo',
    systemPrompt: 'You are an open-source general AI. Be neutral, informative, and draw on a wide range of public knowledge.',
  },
];
