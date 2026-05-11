# Retrato Pesquisas Platform

## Visão Geral
Plataforma web para criação, distribuição e análise de pesquisas de opinião.  
Pesquisadores podem criar questionários (com ou sem lógica condicional), compartilhar via link público ou aplicar presencialmente, e visualizar resultados em gráficos.  
Inclui painel administrativo com gerenciamento de usuários, papéis e permissões (RBAC).

A plataforma é composta por:
- **Backend**: monolítico modular em Node.js/Express + TypeScript
- **Frontend**: SPA mobile‑first em React + Redux Toolkit + Vite

---

## Stack Tecnológica

| Camada      | Tecnologias                                                                                                                                  |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| **Backend** | Node.js (v20), Express 5.2.1, TypeScript estrito, Drizzle ORM, PostgreSQL, BullMQ (fila), Redis, Zod 4.3.6, Better Auth 1.6.5                |
| **Frontend**| React 19, Vite 8, TypeScript 6, Tailwind CSS 4, shadcn/ui (Radix UI), Redux Toolkit + RTK Query, React Router 7, Recharts, Better Auth 1.6.5 |
| **Infra**   | Render (web service + static site), Cloudflare R2 (storage), Upstash Redis (compatível com BullMQ), AWS SDK S3                               |
