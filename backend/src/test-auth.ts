import express from 'express';
import { auth } from './shared/auth/auth.js';

const app = express();
app.use(express.json());
// @ts-ignore
app.use('/api/auth', auth.handler());

app.listen(3000, () => console.log('Teste na 3000'));