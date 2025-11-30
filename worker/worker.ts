import { randomUUIDv7 } from 'bun';
import { createClient } from 'redis';
import { config } from 'src/config';
import { hostname } from 'os';
import { prisma } from 'src/db';
import { Sandbox } from './sandbox';

export class Worker {
    private id: string;
    private workerIdx: number;
    private isShutting = false;
    private currentRunId: string | null = null;
    private redis: ReturnType<typeof createClient>;
    private heartbeatTimer: Timer | null = null;

    private readonly HEARTBEAT_INTERVAL_MS =
        config.WORKER_HEARTBEAT_INTERVAL_MS;
    private readonly HEARTBEAT_TTL_SECONDS = config.WORKER_HEARTBEAT_TTL_SEC;

    constructor(idx: number) {
        this.workerIdx = idx;
        this.id = randomUUIDv7();
        this.redis = createClient({
            url: config.REDIS_URL,
        });
        this.redis.on('error', (err) =>
            console.error(`[Worker ${this.workerIdx}] Redis Error:`, err)
        );
    }

    public async start() {
        await this.redis.connect();
        this.startHeartbeat();
        this.processLoop();
    }

    public async stop() {
        console.log(`[Worker ${this.workerIdx}] Shutting down...`);
        this.isShutting = true;
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        await this.redis.quit();
    }

    private startHeartbeat() {
        this.heartbeatTimer = setInterval(async () => {
            if (this.isShutting) return;

            const workerData = {
                id: this.id,
                hostname: hostname(),
                status: this.currentRunId ? 'BUSY' : 'IDLE',
                currentRunId: this.currentRunId,
                uptime: process.uptime(),
            };

            try {
                await this.redis.set(
                    `worker:${this.id}`,
                    JSON.stringify(workerData),
                    {
                        expiration: {
                            type: 'EX',
                            value: this.HEARTBEAT_TTL_SECONDS,
                        },
                    }
                );
            } catch (error) {
                console.error(
                    `[Worker ${this.workerIdx}] Heartbeat failed:`,
                    error
                );
            }
        }, this.HEARTBEAT_INTERVAL_MS);
    }

    private async processLoop() {
        while (!this.isShutting) {
            try {
                // wait indefinitely for a job to appear in the queue
                const result = await this.redis.blPop(config.QUEUE_NAME, 0);
                if (!result || this.isShutting) continue;

                const jobData = JSON.parse(result.element);
                const { runId, language, code } = jobData;

                this.currentRunId = runId;
                console.log(
                    `[Worker ${this.workerIdx}] Processing Job: ${runId}`
                );

                await prisma.run.update({
                    where: { id: runId },
                    data: { status: 'PROCESSING' },
                });

                const executionResult = await Sandbox.execute(language, code);

                await prisma.run.update({
                    where: { id: runId },
                    data: {
                        status: executionResult.status,
                        output: executionResult.output,
                        error: executionResult.error,
                        executionTime: executionResult.duration,
                    },
                });

                console.log(
                    `[Worker ${this.workerIdx}] Job ${runId} finished: ${executionResult.status}`
                );
            } catch (error: any) {
                // ignore errors caused by worker shutdown
                if (this.isShutting || error.message.includes('Closed')) break;

                console.error(`[Worker ${this.workerIdx}] Loop error:`, error);

                if (this.currentRunId) {
                    await prisma.run
                        .update({
                            where: { id: this.currentRunId },
                            data: { status: 'FAILED', error: 'System Error' },
                        })
                        .catch((e) =>
                            console.error('Failed to mark job FAILED:', e)
                        );
                }
            } finally {
                this.currentRunId = null;
            }
        }
    }
}
