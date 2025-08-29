import { Router } from 'express';
import statusRouter from './status';
import { securityHeaders } from '../securityHeaders';

const router = Router();

router.use(securityHeaders);
router.use('/', statusRouter);

export default router;
