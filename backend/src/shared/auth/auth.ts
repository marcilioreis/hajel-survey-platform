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
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  ],
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 15 * 24 * 60 * 60, // 15 dias
    cookie: {
      attributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        domain: undefined, // deixa o Better Auth decidir
      },
    },
  },
  logger: {
    disabled: false,
    disableColors: false,
    level: 'debug',
    log: (level, message, ...args) => {
      console.info(`[${level}] ${message}`, ...args);
    },
  },
});
