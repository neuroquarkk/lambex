import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    QUEUE_NAME: z.string().default('execution_queue'),
    CONTROL_CHANNEL: z.string().default('worker:control-plane'),

    // Worker configuration
    WORKER_HEARTBEAT_INTERVAL_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(3000),
    WORKER_HEARTBEAT_TTL_SEC: z.coerce.number().int().positive().default(10),

    // Sandbox configuration
    EXECUTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    EXECUTION_MEMORY_LIMIT: z
        .string()
        .regex(/^\d+[kmg]$/i)
        .default('128m'),
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
