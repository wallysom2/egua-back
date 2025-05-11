import express, { Request, Response } from 'express';
import { authRoutes } from './auth.routes.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API working!' });
});

router.use('/auth', authRoutes);

export { router }; 