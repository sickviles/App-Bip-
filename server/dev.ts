/**
 * Script de desarrollo unificado: levanta el servidor backend (Express en puerto 3001)
 * y el servidor frontend (Vite en puerto 3000 con proxy a /api) de manera simultánea.
 * Ejecutar con: npm run dev
 */
import { spawn } from 'node:child_process';

console.log('⚡ Iniciando entorno de desarrollo: Backend (Express) + Frontend (Vite)...');

// Iniciar servidor Express
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3001' },
});

// Iniciar frontend Vite
const vite = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n🛑 Cerrando servidores...');
  server.kill();
  vite.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
