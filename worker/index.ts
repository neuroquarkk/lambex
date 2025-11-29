import { checkConn } from 'src/db';
import { Worker } from './worker';

const workers: Worker[] = [];

async function shutdown() {
    await Promise.allSettled(workers.map((worker) => worker.stop()));
    console.log(`All workers stopped`);
    process.exit(0);
}

async function handleError(error: any) {
    console.error('Error:', error);
    if (workers.length) {
        await Promise.allSettled(workers.map((worker) => worker.stop()));
    }
    process.exit(1);
}

async function main() {
    const args = process.argv.slice(2);
    let conc = 1;

    const cIdx = args.findIndex((arg) => arg === '-c');

    if (cIdx !== -1 && cIdx + 1 < args.length) {
        const value = args[cIdx + 1]!;
        const parsed = parseInt(value, 10);

        if (isNaN(parsed) || parsed < 1) {
            console.warn('-c flag is not valid, defaulting to 1 worker');
        } else {
            conc = parsed;
        }
    }

    process.on('SIGINT', () => shutdown());
    process.on('SIGTERM', () => shutdown());

    await checkConn();
    console.log(`Starting ${conc} worker(s)...`);

    for (let i = 0; i < conc; i++) {
        const worker = new Worker(i + 1);
        workers.push(worker);

        worker
            .start()
            .catch((err) => console.error(`Worker ${i + 1} crashed:`, err));

        // small stagger that prevents all workers from hitting db at exact
        // same millisecond during startup
        await new Promise((r) => setTimeout(r, 50));
    }
}

main().catch(handleError);
