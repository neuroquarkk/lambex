import { exec, spawn } from 'child_process';
import { SUPPORTED_LANGUAGES } from './languages';
import { config } from 'src/config';
import { randomUUID } from 'crypto';

export class Sandbox {
    private static readonly timeoutMs = config.EXECUTION_TIMEOUT_MS;
    private static readonly memoryLimit = config.EXECUTION_MEMORY_LIMIT;

    public static async execute(language: string, code: string) {
        const profile = SUPPORTED_LANGUAGES[language];
        if (!profile) throw new Error(`Unsupported langauge: ${language}`);

        const containerName = `sandbox-${randomUUID()}`;

        return new Promise<{
            output: string;
            error: string | null;
            status: 'COMPLETED' | 'FAILED' | 'TIMEOUT';
            duration: number;
        }>((resolve) => {
            // --rm: auto remove container after exit
            // --network none: block internet access
            // --readonly: make root filesystem read-only
            // --memory: enforce ram limit
            const args = [
                'run',
                '--rm',
                '--init',
                '--name',
                containerName,
                '-i', // keep stdin open for piping code
                '--network',
                'none',
                '--memory',
                this.memoryLimit,
                '--read-only',
                '-v',
                '/tmp', // only /tmp is writable
                profile.image,
                'sh',
                '-c',
                profile.command,
            ];

            const startTime = performance.now();
            const process = spawn('docker', args);

            let output = '';
            let error = '';
            let isTimeout = false;

            // kill container if it runs too long
            const timer = setTimeout(() => {
                isTimeout = true;
                exec(`docker kill ${containerName}`, (err) => {
                    if (err)
                        console.error(
                            `Failed to kill container ${containerName}`
                        );
                });
                process.kill(); // send sigterm to docker cli
                resolve({
                    output: '',
                    error: 'Execution Timed Out',
                    status: 'TIMEOUT',
                    duration: this.timeoutMs,
                });
            }, this.timeoutMs);

            // pipe user code into the container's stdin
            if (process.stdin) {
                process.stdin.write(code);
                process.stdin.end();
            }

            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.stderr.on('data', (data) => {
                error += data.toString();
            });

            process.on('close', (exitCode) => {
                clearTimeout(timer);
                const endTime = performance.now();
                const duration = Math.ceil(endTime - startTime);

                if (isTimeout) return;

                if (exitCode === 0) {
                    resolve({
                        output: output.trim(),
                        error: null,
                        status: 'COMPLETED',
                        duration,
                    });
                } else {
                    resolve({
                        output: output.trim(),
                        error: error.trim() || 'Runtime Error',
                        status: 'FAILED',
                        duration,
                    });
                }
            });

            process.on('error', (err) => {
                clearTimeout(timer);
                resolve({
                    output: '',
                    error: `System Error: ${err.message}`,
                    status: 'FAILED',
                    duration: this.timeoutMs,
                });
            });
        });
    }
}
