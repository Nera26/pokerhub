import { Router } from 'express';
import { getStatus } from '../controllers/statusController';

const router = Router();

router.get('/status', getStatus);

export default router;
