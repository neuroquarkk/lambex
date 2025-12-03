import type { Request, Response } from 'express';

export type TypedController = (
    req: Request,
    res: Response
) => Promise<any> | any;

export type WorkerCommand =
    | { type: 'SPAWN'; count: number; targetId?: string }
    | { type: 'KILL'; workerId: string }
    | { type: 'SHUTDOWN'; targetId?: string };
