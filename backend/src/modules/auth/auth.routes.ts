// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { auth } from '../../shared/auth/auth';
import { fromNodeHeaders } from 'better-auth/node';

const router = Router();

router.post('/sign-up', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = await auth.api.signUpEmail({
      body: { email, password, name },
      asResponse: false,
    });
    res.status(201).json(user);
  } catch (error) {
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
    res.json(session);
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/sign-out', async (req, res) => {
  try {
    const headers = fromNodeHeaders(req.headers);
    await auth.api.signOut({ headers });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Sign out failed' });
  }
});

router.get('/session', async (req, res) => {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({ headers });
  res.json(session || null);
});

export default router;