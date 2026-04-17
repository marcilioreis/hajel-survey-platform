// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { auth } from '../../shared/auth/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

const router = Router();

router.post('/sign-up', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = await auth.api.signUpEmail({
      body: { email, password, name },
      asResponse: false,
    });
    console.log('User registered:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Erro detalhado no sign-up:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

router.post('/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body;
    const session = await auth.api.signInEmail({
      body: { email, password },
      asResponse: false,
    });
    // O cookie de sessão é definido automaticamente na resposta
    console.log('User session :>> ', session);
    res.json(session);
  } catch (error) {
    console.error('Erro detalhado no sign-in:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/sign-out', async (req, res) => {
  try {
    const headers = fromNodeHeaders(req.headers);
    await auth.api.signOut({ headers });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro detalhado no sign-out:', error);
    res.status(400).json({ error: 'Sign out failed' });
  }
});

router.get('/session', async (req, res) => {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({ headers });
  console.log('Session details :>> ', session);
  res.json(session || null);
});

export default router;