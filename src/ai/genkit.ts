import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const google = googleAI();

export const ai = genkit({
  plugins: [google],
  model: 'googleai/gemini-1.5-flash-latest',
});

export { google as googleAI };
