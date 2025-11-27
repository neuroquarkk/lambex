import type { Request, Response } from 'express';

export type TypedController = (
    req: Request,
    res: Response
) => Promise<any> | any;
