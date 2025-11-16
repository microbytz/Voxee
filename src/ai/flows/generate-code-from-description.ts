'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating code from a description.
 *
 * The flow takes a description of a function or code snippet and a programming language as input,
 * and generates the corresponding code.
 *
 * @interface GenerateCodeInput - The input type for the generateCode function.
 * @interface GenerateCodeOutput - The output type for the generateCode function.
 * @function generateCode - The main function that triggers the code generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeInputSchema = z.object({
  description: z
    .string()
    .describe('A detailed description of the function or code snippet to generate.'),
  language: z
    .string()
    .describe('The programming language in which to generate the code.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z
    .string()
    .describe('The generated code snippet in the specified programming language.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
}

const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {schema: GenerateCodeInputSchema},
  output: {schema: GenerateCodeOutputSchema},
  prompt: `You are an expert software developer who can generate code from a description.

  Generate the code snippet in the specified programming language that matches the description.

  Description: {{{description}}}
  Language: {{{language}}}

  Here is the generated code:`,
});

const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async input => {
    const {output} = await generateCodePrompt(input);
    return output!;
  }
);
