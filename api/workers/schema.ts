import { z } from 'zod';

export const spawnWorkerSchema = z.object({
    count: z.number().int().min(1).max(50).default(1),
});
