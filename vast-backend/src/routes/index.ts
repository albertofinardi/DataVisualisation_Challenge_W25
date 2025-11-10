import { router as placeholderRouter } from './placeholder';
import { router as dataRouter } from './data';
import { Router } from 'express';

const router = Router();

router.use('/placeholder', placeholderRouter);
router.use('/data', dataRouter);

export { router };