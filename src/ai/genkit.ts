'use server';

import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize the googleAI plugin
export const google = googleAI();

// Configure Genkit with the googleAI plugin
export const ai = genkit({
  plugins: [google],
  model: 'googleai/gemini-1.5-flash-latest',
});
