// src/types/express.d.ts
import { User, Session } from '../shared/auth/auth';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

