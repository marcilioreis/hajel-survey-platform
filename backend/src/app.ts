import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import surveyRoutes from './modules/surveys/surveys.routes.js';

import { auth } from './shared/auth/auth.js';
import { toNodeHandler } from 'better-auth/node';

const app = express();
const port = process.env.PORT || 3000;

try {
  // Middlewares globais
  app.use(helmet());
  app.use(compression());
  app.use(morgan('dev'));

  // CORS deve vir ANTES do handler do Better Auth, com credentials: true
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );

  // Health check (antes do handler do Better Auth)
  app.get('/health', (req, res) => res.send('OK'));

  // Handler do Better Auth – wrapper que preserva a URL completa
  // app.all('/api/auth/{*any}', toNodeHandler(auth));
  app.all('/api/auth/*splat', toNodeHandler(auth));

  // ⚠️ IMPORTANTE: NÃO use express.json() ANTES do handler do Better Auth
  // Mova o express.json() para DEPOIS, se necessário para outras rotas
  app.use(express.json());

  // Outras rotas da sua aplicação (ex: surveys)
  app.use('/api/surveys', surveyRoutes);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  });
} catch (error) {
  console.error('Erro ao iniciar servidor:', error);
}

export default app;
