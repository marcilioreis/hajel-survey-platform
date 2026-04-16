import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import authRoutes from './modules/auth/auth.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.send('OK'));

app.use('/api/auth', authRoutes);

export default app;