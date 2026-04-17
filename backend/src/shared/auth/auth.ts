import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '../db/index.js';
import * as schema from '../db/schema/auth.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  // basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!, // para testes via curl/localhost
    'http://localhost:5173', // frontend (se houver)
  ],
  session: {
    expiresIn: 30 * 24 * 60 * 60,
    updateAge: 15 * 24 * 60 * 60,
  },
  logger: {
    disabled: false,
    disableColors: false,
    level: 'debug',
    log: (level, message, ...args) => {
      // Custom logging implementation
      // eslint-disable-next-line no-console
      console.log(`[${level}] ${message}`, ...args);
    },
  },
});
