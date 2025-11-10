import { Router } from 'express';

const router = Router();

// Placeholder route
router.get('/', (_req, res) => {
  res.json({
    message: 'This is a placeholder route',
    info: 'You can replace this with actual functionality later.'
  });
});

export { router };