import { Router } from 'express';
import { killWorker, listWorkers, spawnWorkers } from './controller';

const router = Router();

router.get('/', listWorkers);
router.post('/scale', spawnWorkers);
router.delete('/:workerId', killWorker);

export default router;
