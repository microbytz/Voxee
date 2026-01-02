
export interface Agent {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Open Source';
  systemPrompt: string;
}

export const AGENTS: Agent[] = [
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano (Fast)',
    provider: 'OpenAI',
    systemPrompt: 'You are a fast, concise assistant. Prioritize short, clear answers.',
  },
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
    system_prompt: 'You are a logical tutor. Explain your reasoning process clearly and carefully. Always provide detailed, step-by-step explanations for your conclusions to help the user learn.',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus (Deep Reasoning)',
    provider: 'Anthropic',
    systemPrompt: 'You are a deep reasoning expert. Analyze problems rigorously and from first principles. Provide comprehensive and in-depth analysis.',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku (Quick)',
    provider: 'Anthropic',
    systemPrompt: 'You are a fast responder. Keep answers brief, efficient, and to the point.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Speed)',
    provider: 'Google',
    systemPrompt: 'You are a speed-optimized assistant. Respond as quickly as possible while maintaining accuracy.',
  },
    {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro (Context)',
    provider: 'Google',
    systemPrompt: 'You are a long-context reasoning model. You excel at handling complex tasks, long documents, and multi-faceted questions. Use your large context window to synthesize information.',
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
    {
    id: 'mistral-large',
    name: 'Mistral Large (Reasoning)',
    provider: 'Open Source',
    systemPrompt: 'You are a strong general reasoning assistant. Be precise, logical, and structured in your answers.',
  },
  {
    id: 'mixtral-8x7b',
    name: 'Mixtral 8x7B (Efficient)',
    provider: 'Open Source',
    systemPrompt: 'You are an efficient Mixture of Experts (MoE) model. Be concise but correct. You are good at quick summaries and classification.',
  }
];
