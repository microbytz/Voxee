'use server';
/**
 * @fileoverview This file initializes and configures the Genkit AI instance.
 * It serves as a single source of truth for the AI setup, including plugins and models.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash-latest',
});
