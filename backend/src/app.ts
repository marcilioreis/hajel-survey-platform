import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './shared/auth/auth.js';
import surveyRoutes from './modules/surveys/surveys.routes.js';
import publicRoutes from './modules/responses/public.routes.js';
import { createApolloServer } from './graphql/apollo.js';

const app = express();

try {
  // Configura o replacer global para respostas JSON
  // app.set('json replacer', (key: string, value: any) => {
  //   if (key.toLowerCase().includes('date') && typeof value === 'string') {
  //     const date = new Date(value);
  //     // Converte qualquer instância de Date para string ISO
  //     if (!isNaN(date.getTime())) {
  //       return date.toISOString();
  //     }
  //   } else if (value instanceof Date) {
  //     return value.toISOString();
  //   }
  //   return value;
  // });

  // // Configura o replacer para res.json() especificamente
  // app.response.json = function (data: any) {
  //   const replacer = this.app.get('json replacer');
  //   const jsonString = JSON.stringify(data, replacer);
  //   this.set('Content-Type', 'application/json');
  //   return this.send(jsonString);
  // };

  // // Middleware para converter Date em ISO string em todo o corpo da resposta
  // app.use((req, res, next) => {
  //   const originalJson = res.json;
  //   res.json = function (data: any) {
  //     const replacer = this.app.get('json replacer');
  //     const jsonString = JSON.stringify(data, replacer);
  //     this.set('Content-Type', 'application/json');
  //     return this.send(jsonString);
  //   };
  //   next();
  // });

  // // Exemplo de uso do replacer global
  // app.get('/test', (req, res) => {
  //   res.json({
  //     message: 'Teste de data',
  //     now: new Date(),
  //     startDate: new Date('2024-01-01T00:00:00Z'),
  //     endDate: new Date('2024-12-31T23:59:59Z'),
  //   });
  // });

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
  app.use('/', publicRoutes); // rotas públicas sem prefixo /api

  // Inicializa o Apollo e obtém os middlewares
  const { authMiddleware, apolloMiddleware } = await createApolloServer();

  // Monta o endpoint GraphQL
  app.use('/graphql', express.json(), authMiddleware, apolloMiddleware);
} catch (error) {
  console.error('Erro ao iniciar servidor:', error);
}

export default app;
