import { router as placeholderRouter } from './placeholder';
import { router as dataRouter } from './data';
import { router as heatmapRouter } from './heatmap';
import { router as utilsRouter } from './utils';
import { Router } from 'express';

const router = Router();

router.use('/placeholder', placeholderRouter);
router.use('/data', dataRouter);
router.use('/heatmap', heatmapRouter);
router.use('/utils', utilsRouter);

export { router };