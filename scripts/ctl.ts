import { Command } from 'commander';
import { createClient } from 'redis';
import { config } from 'src/config';
import type { WorkerCommand } from 'src/types';

const program = new Command();
const redis = createClient({ url: config.REDIS_URL });

async function dispatch(cmd: WorkerCommand) {
    try {
        await redis.connect();
        await redis.publish(config.CONTROL_CHANNEL, JSON.stringify(cmd));
        console.log('Signal dispatched');
        console.log('  Payload:', JSON.stringify(cmd, null, 2));
    } catch (error) {
        console.error('Failed to dispatch command:', error);
    } finally {
        await redis.quit();
    }
}

program.name('lambex-ctl');

program
    .command('scale')
    .argument('<count>', 'Number of workers to spawn')
    .option('-t, --target <id>', 'Specific Manager Id to target')
    .description('Spawn new workers')
    .action(async (countStr, options) => {
        const count = parseInt(countStr, 10);
        if (isNaN(count) || count < 1) {
            console.error('Error: Count must be a postive integer');
            process.exit(1);
        }

        await dispatch({
            type: 'SPAWN',
            count,
            targetId: options.target,
        });
    });

program
    .command('kill')
    .argument('<workerId>', 'UUID of the worker to stop')
    .description('Kill a specific worker instance')
    .action(async (workerId) => {
        await dispatch({
            type: 'KILL',
            workerId,
        });
    });

program
    .command('list-nodes')
    .description('Show active manager nodes')
    .action(async () => {
        await redis.connect();
        const keys = await redis.keys('manager:*');

        if (keys.length === 0) {
            console.log('No active manager nodes found');
        } else {
            console.log(`Found ${keys.length} active manager(s):`);
            keys.forEach((k) => console.log(`- ${k.replace('manager:', '')}`));
        }

        await redis.quit();
    });

program
    .command('list-workers')
    .description('Show all active Worker instances')
    .action(async () => {
        await redis.connect();
        const keys = await redis.keys('worker:*');

        if (keys.length === 0) {
            console.log('No active workers found');
            await redis.quit();
            return;
        }

        const data = await redis.mGet(keys);
        const workers = data
            .map((d) => (d ? JSON.parse(d) : null))
            .filter((w) => w !== null)
            .sort((a, b) => (a.uptime > b.uptime ? -1 : 1));

        console.table(workers);
        await redis.quit();
    });

program.parse();
