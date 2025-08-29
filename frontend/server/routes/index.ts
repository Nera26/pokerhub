import { Router } from 'express';
import statusRouter from './status';

const router = Router();

router.use('/', statusRouter);

export default router;
