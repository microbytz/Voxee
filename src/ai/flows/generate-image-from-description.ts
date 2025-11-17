'use server';

/**
 * @fileOverview Image generation flow from a text description.
 *
 * - generateImageFromDescription - A function that generates an image based on a text description.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {z} from 'genkit';
import type { GenerateImageFromDescriptionInput, GenerateImageFromDescriptionOutput } from '@/lib/types';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash-latest',
});

const GenerateImageFromDescriptionInputSchema = z.object({
  imageDescription: z
    .string()
    .describe('The description of the image to generate.'),
});

const GenerateImageFromDescriptionOutputSchema = z.object({
  image: z
    .string()
    .describe(
      'The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
  progress: z.string().describe('Short summary of what has been generated.')
});

export async function generateImageFromDescription(
  input: GenerateImageFromDescriptionInput
): Promise<GenerateImageFromDescriptionOutput> {
  return generateImageFromDescriptionFlow(input);
}

const generateImageFromDescriptionPrompt = ai.definePrompt({
  name: 'generateImageFromDescriptionPrompt',
  input: {schema: GenerateImageFromDescriptionInputSchema},
  output: {schema: GenerateImageFromDescriptionOutputSchema},
  prompt: `Generate an image based on the following description: {{{imageDescription}}}. Return the image as a data URI.
  Also return a short one sentence summary of what you have generated in the progress field.
  `,
});

const generateImageFromDescriptionFlow = ai.defineFlow(
  {
    name: 'generateImageFromDescriptionFlow',
    inputSchema: GenerateImageFromDescriptionInputSchema,
    outputSchema: GenerateImageFromDescriptionOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: input.imageDescription,
    });
    const progress = `Generated an image from the description: ${input.imageDescription}`
    return {
      image: media!.url,
      progress
    };
  }
);
