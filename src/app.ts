import express, { Request, Response } from 'express';
import { router } from './routes/index.js';
import cors from 'cors';
import path from 'path';

const app = express();

// Configuração do CORS
app.use(cors());

app.use(express.json({limit: '50mb'})); // Aumentar limite para imagens base64
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: '🎯 Servidor rodando normalmente' });
});


export { app }; 