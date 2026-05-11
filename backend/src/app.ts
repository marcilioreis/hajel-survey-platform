import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { RedisStore } from 'rate-limit-redis';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { auth } from './shared/auth/auth.js';
import surveyRoutes from './modules/surveys/surveys.routes.js';
import locationRoutes from './modules/locations/locations.routes.js';
import publicRoutes from './modules/responses/public.routes.js';
import { createApolloServer } from './graphql/apollo.js';
import { redis } from './shared/redis/index.js';
import { authenticate } from './shared/auth/middleware.js';
import { getUserPermissionSet, getUserRoleNames } from './shared/middleware/rbac.js';
import { loadPermissions } from './shared/middleware/loadPermissions.js';
import geographyRoutes from './modules/geography/geography.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

// ---- Rate limiter com prefixo ÚNICO no Redis ----
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: any[]) => redis.call(args[0], ...args.slice(1)),
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Limite de requisições da API excedido, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

try {
  // console.info('[DIAG] Express app created');
  // app.use((req, res, next) => {
  //   console.info(`[DIAG] Request: ${req.method} ${req.path}`);
  //   next();
  // });
  app.set('trust proxy', 1);
  // Middlewares globais

  // CORS antes do handler do Better Auth
  app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:4173', // ✅ Vite preview
        'http://127.0.0.1:41705', // ✅ Browser proxy
        'http://localhost:3000', // se precisar acessar via frontend local na porta 3000
        'https://studio.apollographql.com',
      ],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  } else {
    app.use(helmet());
  }

  app.use(compression());
  app.use(morgan('dev'));

  // Health check
  app.get('/health', (req, res) => res.send('OK'));

  // ================== ROTEAMENTO PRINCIPAL ==================

  // Rota de teste
  app.get('/api/auth/test', (req, res) => res.json({ ok: true }));

  // Rota personalizada que retorna sessão + permissões
  app.get('/api/auth/get-session', async (req, res) => {
    try {
      const headers = fromNodeHeaders(req.headers);
      // Obtém a sessão atual (pode ser nula se não autenticado)
      const session = await auth.api.getSession({ headers });

      if (!session) {
        return res.json(null);
      }

      // Busca permissões e roles em paralelo (para performance)
      const [permissionsSet, roleNames] = await Promise.all([
        getUserPermissionSet(session.user.id),
        getUserRoleNames(session.user.id),
      ]);

      res.json({
        user: session.user,
        session: session.session,
        permissions: Array.from(permissionsSet),
        roles: roleNames,
      });
    } catch (error) {
      console.error('Erro ao obter sessão enriquecida:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 1. Autenticação (Better Auth) com rate limit específico
  app.all('/api/auth/{*splat}', toNodeHandler(auth));

  // 2. JSON parser para as próximas rotas (pode ser aplicado globalmente após o handler)
  app.use(express.json());

  // 3. Rotas autenticadas (surveys, locations) – autenticação, permissões e apiLimiter
  app.use('/api/surveys', authenticate, loadPermissions, apiLimiter, surveyRoutes);
  app.use('/api/locations', authenticate, loadPermissions, apiLimiter, locationRoutes);
  app.use('/api/geography', geographyRoutes);
  app.use('/api/admin', adminRoutes);

  // 4. Rotas públicas com publicLimiter (aplicado dentro do próprio arquivo de rotas)
  app.use('/', publicRoutes); // o publicLimiter é aplicado dentro de publicRoutes

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 5. GraphQL
  const { authMiddleware, apolloMiddleware } = await createApolloServer();
  app.use('/graphql', authMiddleware, apolloMiddleware);
} catch (error) {
  console.error('Erro ao iniciar servidor:', error);
}

export default app;
