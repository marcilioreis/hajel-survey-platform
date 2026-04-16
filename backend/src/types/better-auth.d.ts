// src/types/better-auth.d.ts
import { BetterAuthOptions } from 'better-auth';

declare module 'better-auth' {
  interface User {
    role?: string | null;
  }
}