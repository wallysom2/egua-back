import express, { Request, Response, RequestHandler } from 'express';
import { router } from './routes/index.js';
import cors from 'cors';
import { conteudoRoutes } from './routes/conteudo.routes.js';
import { linguagemRoutes } from './routes/linguagem.routes.js';
import { questaoRoutes } from './routes/questao.routes.js';
import { exercicioRoutes } from './routes/exercicio.routes.js';
import { userExercicioRoutes } from './routes/userExercicio.routes.js';
import { userRespostaRoutes } from './routes/userResposta.routes.js';
import { iaCriterioRoutes } from './routes/iaCriterio.routes.js';
import { usuarioRoutes } from './routes/usuario.routes.js';
import { turmaRoutes } from './routes/turma.routes.js';
import { autenticar } from './middlewares/auth.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { prisma } from './utils/database.js';

const app = express();

// Configuração do CORS
app.use(cors());

app.use(express.json({ limit: '50mb' })); // Aumentar limite para imagens base64
app.use(express.urlencoded({ extended: true }));

// Rotas públicas (não precisam de autenticação)
app.use('/api', router);

// Health check endpoint - DEVE ficar antes do middleware de autenticação
// Usado para wake-up do Render e monitoramento
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(200).json({
      status: 'healthy',
      database: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
});

// Middleware de autenticação para rotas protegidas (excluindo /api/auth)
app.use((req, res, next) => {
  // Pular autenticação para rotas de auth
  if (req.path.startsWith('/api/auth')) {
    return next();
  }
  autenticar(req, res, next);
});

// Rotas protegidas (precisam de autenticação)
app.use('/conteudos', conteudoRoutes);
app.use('/linguagens', linguagemRoutes);
app.use('/questoes', questaoRoutes);
app.use('/exercicios', exercicioRoutes);
app.use('/progresso-exercicios', userExercicioRoutes);
app.use('/respostas', userRespostaRoutes);
app.use('/ia-criterios', iaCriterioRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/turmas', turmaRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: '🎯 Servidor rodando normalmente' });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

export { app };
