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
//import { autenticar } from './middlewares/auth.middleware.js';

const app = express();

// Configuração do CORS
app.use(cors());

app.use(express.json({limit: '50mb'})); // Aumentar limite para imagens base64
app.use(express.urlencoded({ extended: true }));

// Rotas públicas (não precisam de autenticação)
app.use('/api', router);

// Middleware de autenticação global para todas as outras rotas

// Rotas protegidas (precisam de autenticação)
app.use('/conteudos', conteudoRoutes);
app.use('/linguagens', linguagemRoutes);
app.use('/questoes', questaoRoutes);
app.use('/exercicios', exercicioRoutes);
app.use('/progresso-exercicios', userExercicioRoutes);
app.use('/respostas', userRespostaRoutes);
app.use('/ia-criterios', iaCriterioRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: '🎯 Servidor rodando normalmente' });
});

export { app }; 