import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { toNodeHandler } from 'better-auth/node';
import { RedisStore } from 'rate-limit-redis';
import { auth } from './shared/auth/auth.js';
import surveyRoutes from './modules/surveys/surveys.routes.js';
import globalLocationRoutes from './modules/locations/global.routes.js';
import publicRoutes from './modules/responses/public.routes.js';
import { createApolloServer } from './graphql/apollo.js';
import { redis } from './shared/redis/index.js';
import { authenticate } from './shared/auth/middleware.js';
import { loadPermissions } from './shared/middleware/loadPermissions.js';

// ---- Rate limiter com prefixo ÚNICO no Redis ----
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:api:', // prefixo único
  }),
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Limite de requisições da API excedido, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// const authLimiterMem = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 30,
//   message: { error: 'Muitas requisições, tente novamente.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

const app = express();

try {
  // app.set('trust proxy', 1);
  // Middlewares globais
  if (process.env.NODE_ENV !== 'production') {
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  } else {
    app.use(helmet());
  }

  app.use(compression());
  app.use(morgan('dev'));

  // CORS antes do handler do Better Auth
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

  // Health check
  app.get('/health', (req, res) => res.send('OK'));

  // ================== ROTEAMENTO PRINCIPAL ==================

  // 1. Autenticação (Better Auth) com rate limit específico
  // app.all('/api/auth/{*splat}', authLimiterMem, toNodeHandler(auth));
  // app.use('/api/auth', apiLimiter, toNodeHandler(auth));

  // 2. JSON parser para as próximas rotas (pode ser aplicado globalmente após o handler)
  app.use(express.json());

  // 3. Rotas autenticadas (surveys, locations) – autenticação, permissões e apiLimiter
  app.use('/api/surveys', authenticate, loadPermissions, apiLimiter, surveyRoutes);
  app.use('/api/locations', authenticate, loadPermissions, apiLimiter, globalLocationRoutes);

  // 4. Rotas públicas com publicLimiter (aplicado dentro do próprio arquivo de rotas)
  app.use('/', publicRoutes); // o publicLimiter é aplicado dentro de publicRoutes

  // 5. GraphQL
  const { authMiddleware, apolloMiddleware } = await createApolloServer();
  app.use('/graphql', authMiddleware, apolloMiddleware);
} catch (error) {
  console.error('Erro ao iniciar servidor:', error);
}

export default app;
