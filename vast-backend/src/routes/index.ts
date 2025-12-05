import { router as placeholderRouter } from './placeholder';
import { router as dataRouter } from './data';
import { router as heatmapRouter } from './heatmap';
import { router as utilsRouter } from './utils';
import { router as streamgraphRouter } from './streamgraph';
import { router as activityCalendarRouter } from './activity-calendar';
import participantComparisonRouter from './participant-comparison';
import { Router } from 'express';

const router = Router();

router.use('/placeholder', placeholderRouter);
router.use('/data', dataRouter);
router.use('/heatmap', heatmapRouter);
router.use('/streamgraph', streamgraphRouter);
router.use('/activity-calendar', activityCalendarRouter);
router.use('/participant-comparison', participantComparisonRouter);
router.use('/utils', utilsRouter);

export { router };