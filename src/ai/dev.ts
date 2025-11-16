import { config } from 'dotenv';
config();

import '@/ai/flows/generate-code-from-description.ts';
import '@/ai/flows/summarize-uploaded-document.ts';
import '@/ai/flows/answer-question-from-web.ts';
import '@/ai/flows/generate-image-from-description.ts';