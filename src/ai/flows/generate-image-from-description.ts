
'use server';
/**
 * @fileOverview A flow for generating an image from a description.
 */
import { config } from 'dotenv';
config();

import { ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { GenerateImageFromDescriptionInput, GenerateImageFromDescriptionOutput } from '@/lib/types';

const GenerateImageInputSchema = z.object({
  imageDescription: z.string().describe('A description of the image to generate.'),
  image: z.string().optional().describe('An optional base image to modify as a data URI.'),
});

const GenerateImageOutputSchema = z.object({
  image: z.string().describe('The generated image as a data URI.'),
  progress: z.string().optional().describe('Progress updates during image generation.')
});

ai.configure({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  logLevel: 'debug',
  enableTracing: true,
});

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: input.imageDescription,
    });
    
    const imageUrl = media.url;
    if (!imageUrl) {
        throw new Error("Image generation failed to produce an image.");
    }

    return { image: imageUrl };
  }
);

export async function generateImage(input: GenerateImageFromDescriptionInput): Promise<GenerateImageFromDescriptionOutput> {
  return await generateImageFlow(input);
}
