import { Router } from 'express';
import { createRun, getRun } from './controller';

const router = Router();

router.post('/', createRun);
router.get('/:runId', getRun);

export default router;
