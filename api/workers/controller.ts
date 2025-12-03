import { redis } from 'src/db';
import type { TypedController } from 'src/types';
import { spawnWorkerSchema } from './schema';
import { config } from 'src/config';

export const listWorkers: TypedController = async (_req, res) => {
    try {
        const keys = await redis.keys('worker:*');
        if (keys.length === 0) {
            return res.json([]);
        }

        const workersRaw = await redis.mGet(keys);

        const workers = workersRaw
            .map((w) => (w ? JSON.parse(w) : null))
            .filter((w) => w !== null);

        // sory by creation time
        workers.sort((a, b) => (a.uptime > b.uptime ? -1 : 1));

        return res.json(workers);
    } catch (error) {
        console.error('List workers error:', error);
        return res.status(500).json({ error: 'Failed to fetch workers' });
    }
};

export const spawnWorkers: TypedController = async (req, res) => {
    try {
        const validation = spawnWorkerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues });
        }

        const { count } = validation.data;

        await redis.publish(
            config.CONTROL_CHANNEL,
            JSON.stringify({ type: 'SPAWN', count })
        );

        return res.status(202).json({
            message: `Signal sent to spawn ${count} worker(s)`,
        });
    } catch (error) {
        console.error('Spawn worker error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const killWorker: TypedController = async (req, res) => {
    try {
        const { workerId } = req.params;
        if (!workerId) {
            return res.status(400).json({ error: 'Worker Id is required' });
        }

        await redis.publish(
            config.CONTROL_CHANNEL,
            JSON.stringify({ type: 'KILL', workerId })
        );

        return res.status(202).json({
            message: `Signal sent to kill worker ${workerId}`,
        });
    } catch (error) {
        console.error('Kill worker error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
