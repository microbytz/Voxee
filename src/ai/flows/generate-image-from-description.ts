'use server';

/**
 * @fileOverview Image generation flow from a text description.
 *
 * - generateImageFromDescription - A function that generates an image based on a text description.
 * - GenerateImageFromDescriptionInput - The input type for the generateImageFromDescription function.
 * - GenerateImageFromDescriptionOutput - The return type for the generateImageFromDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageFromDescriptionInputSchema = z.object({
  imageDescription: z
    .string()
    .describe('The description of the image to generate.'),
});
export type GenerateImageFromDescriptionInput = z.infer<
  typeof GenerateImageFromDescriptionInputSchema
>;

const GenerateImageFromDescriptionOutputSchema = z.object({
  image: z
    .string()
    .describe(
      'The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
  progress: z.string().describe('Short summary of what has been generated.')
});
export type GenerateImageFromDescriptionOutput = z.infer<
  typeof GenerateImageFromDescriptionOutputSchema
>;

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
