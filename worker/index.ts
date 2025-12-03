import { createClient } from 'redis';
import { config } from 'src/config';
import { Worker } from './worker';
import type { WorkerCommand } from 'src/types';
import { hostname } from 'os';

const MANAGER_ID = `mgr-${hostname()}-${process.pid}`;
const activeWorkers = new Map<string, Worker>();

const redisClient = createClient({ url: config.REDIS_URL });
const subClient = redisClient.duplicate();

function startMgrHeartbeat() {
    setInterval(async () => {
        try {
            await redisClient.set(`manager:${MANAGER_ID}`, 'ONLINE', {
                expiration: {
                    type: 'EX',
                    value: 5,
                },
            });
        } catch (error) {
            console.error('[Manager] Heartbeat failed:', error);
        }
    }, 3000);
}

async function spawn(count: number = 1) {
    for (let i = 0; i < count; i++) {
        const idx = activeWorkers.size + 1;
        const worker = new Worker(idx);

        activeWorkers.set(worker.workerId, worker);

        worker.start().catch((err) => {
            console.error(`Worker ${worker.workerId} crashed:`, err);
            activeWorkers.delete(worker.workerId);
        });

        console.log(`[Manager] Spawned worker: ${worker.workerId}`);
        await new Promise((r) => setTimeout(r, 50));
    }
}

async function kill(targetId: string) {
    const worker = activeWorkers.get(targetId);
    if (!worker) {
        console.warn(`[Manager] Worker ${targetId} not found`);
        return;
    }

    await worker.stop();
    activeWorkers.delete(targetId);
    console.log(`[Manager] Killed worker: ${targetId}`);
}

async function main() {
    await Promise.all([redisClient.connect(), subClient.connect()]);
    startMgrHeartbeat();
    console.log(`[Manager] Started with ID: ${MANAGER_ID}`);

    await subClient.subscribe(config.CONTROL_CHANNEL, async (msg) => {
        const cmd = JSON.parse(msg) as WorkerCommand;

        if ('targetId' in cmd && cmd.targetId && cmd.targetId !== MANAGER_ID) {
            return;
        }

        switch (cmd.type) {
            case 'SPAWN':
                await spawn(cmd.count);
                break;
            case 'KILL':
                await kill(cmd.workerId);
                break;
            case 'SHUTDOWN':
                console.log(`[Manager] Shutting down node ${MANAGER_ID}`);
                process.exit(0);
        }
    });

    console.log(`[Manager] Listening on channel: ${config.CONTROL_CHANNEL}`);
}

process.on('SIGINT', async () => {
    console.log('[Manager] Shutting down...');
    await Promise.allSettled([...activeWorkers.values()].map((w) => w.stop()));
    process.exit(0);
});

main().catch(console.error);
