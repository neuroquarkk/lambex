import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    QUEUE_NAME: z.string().default('execution_queue'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error(result.error.issues);
    throw new Error('Invalid env vars');
}

const env = result.data;

const IsProd = env.NODE_ENV === 'production';

export const config = {
    ...env,
    IsProd,
    MorganFormat: IsProd ? 'combined' : 'dev',
} as const;
