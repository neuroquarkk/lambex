import type { TypedController } from 'src/types';
import { createRunSchema } from './schema';
import { prisma, redis } from 'src/db';
import { config } from 'src/config';

export const createRun: TypedController = async (req, res) => {
    try {
        const validation = createRunSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues });
        }

        const { language, code } = validation.data;

        const run = await prisma.run.create({
            data: {
                language,
                code,
            },
            select: { id: true, status: true },
        });

        try {
            await redis.rPush(
                config.QUEUE_NAME,
                JSON.stringify({
                    runId: run.id,
                    language,
                    code,
                })
            );
        } catch (error) {
            console.error('Failed to queue run:', error);
            await prisma.run.delete({ where: { id: run.id } });
            return res
                .status(500)
                .json({ error: 'Failed to queue submission' });
        }

        return res.status(202).json({
            id: run.id,
            status: run.status,
            url: `/runs/${run.id}`,
            message: 'Submission accepted',
        });
    } catch (error) {
        console.error('Create run error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRun: TypedController = async (req, res) => {
    try {
        const runId = req.params.runId as string;

        const run = await prisma.run.findUnique({
            where: { id: runId },
        });

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        return res.json({
            ...run,
        });
    } catch (error) {
        console.error('Get run error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
