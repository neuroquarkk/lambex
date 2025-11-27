import { z } from 'zod';

const languageEnum = ['javascript'];

export const createRunSchema = z.object({
    language: z.enum(languageEnum),
    code: z
        .string()
        .min(1, 'Code cannot be empty')
        .max(20000, 'Code limit is 20k characters'),
});
