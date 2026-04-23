import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './shared/auth/auth.js';
import surveyRoutes from './modules/surveys/surveys.routes.js';
import globalLocationRoutes from './modules/locations/global.routes.js';
import publicRoutes from './modules/responses/public.routes.js';
import { createApolloServer } from './graphql/apollo.js';

const app = express();

try {
  // Middlewares globais
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
    );
  } else {
    app.use(helmet());
  }

  app.use(compression());
  app.use(morgan('dev'));

  // CORS deve vir ANTES do handler do Better Auth, com credentials: true
  app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'https://studio.apollographql.com',
      ],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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
  app.use('/api/locations', globalLocationRoutes);
  app.use('/', publicRoutes); // rotas públicas sem prefixo /api

  // Inicializa o Apollo e obtém os middlewares
  const { authMiddleware, apolloMiddleware } = await createApolloServer();

  // Monta o endpoint GraphQL
  app.use('/graphql', express.json(), authMiddleware, apolloMiddleware);
} catch (error) {
  console.error('Erro ao iniciar servidor:', error);
}

export default app;
