/* eslint-disable no-console */
// src/server.ts
import app from './app.js';
import { startExportWorker } from './shared/queue/export.worker.js';
import { redis } from './shared/redis/index.js';
import { exportQueue } from './shared/queue/export.queue.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Inicia o worker do Bull
startExportWorker();
console.log('📦 Export worker started');

// Inicia o servidor HTTP
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed');
    await exportQueue.close();
    await redis.quit();
    console.log('Redis connections closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
