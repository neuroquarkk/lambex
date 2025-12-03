import { createClient } from 'redis';
import { config } from 'src/config';
import { Worker } from './worker';
import type { WorkerCommand } from 'src/types';

const activeWorkers = new Map<string, Worker>();

const subClient = createClient({ url: config.REDIS_URL });

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
    await subClient.connect();
    await subClient.subscribe(config.CONTROL_CHANNEL, async (msg) => {
        const cmd = JSON.parse(msg) as WorkerCommand;

        switch (cmd.type) {
            case 'SPAWN':
                await spawn(cmd.count);
                break;
            case 'KILL':
                await kill(cmd.workerId);
                break;
            case 'SHUTDOWN':
                console.log('[Manager] Received global shutdown signal');
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
