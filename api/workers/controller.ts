import { redis } from 'src/db';
import type { TypedController } from 'src/types';
import { spawnWorkerSchema } from './schema';
import { config } from 'src/config';
import { randomInt } from 'crypto';

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

        const { count, targetId: explicitTarget } = validation.data;
        let targetId = explicitTarget;

        if (!targetId) {
            const managerKeys = await redis.keys('manager:*');
            if (managerKeys.length === 0) {
                return res.status(503).json({
                    error: 'No active workers nodes found',
                });
            }

            // Pick a random manager
            const randomKey = managerKeys[randomInt(0, managerKeys.length)];
            targetId = randomKey?.replace('manager:', '');
        }

        await redis.publish(
            config.CONTROL_CHANNEL,
            JSON.stringify({ type: 'SPAWN', count, targetId })
        );

        return res.status(202).json({
            message: `Signal sent to spawn ${count} worker(s)`,
            target: targetId,
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
