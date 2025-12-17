/**
 * Server HTTP (Express) da aplicação.
 * Responsabilidades:
 * - Carregar variáveis de ambiente (.env)
 * - Servir arquivos estáticos (index.html, /js, /css)
 * - Expor endpoints públicos (/ e /health)
 * - Expor a API protegida em /api (com middleware de autenticação)
 * - Tratar 404 da API e erros gerais
 * - Testar a conexão com o MySQL no startup
 *
 * Variáveis de ambiente esperadas:
 * - PORT: porta do servidor (default: 3000)
 * - API_TOKEN: token usado pelo middleware `auth` (Bearer)
 * - Credenciais do banco (usadas por testConnection / camada database)
 */
import 'dotenv/config';               // Carrega variáveis do .env para process.env
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { testConnection } from './database/connection.js';  // Verifica conexão MySQL
import { auth } from './middlewares/auth.js';               // Middleware de autenticação Bearer
import { router } from './routes/index.js';                 // Rotas da API

// Em módulos ES, __filename/__dirname não existem:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastas/arquivos relevantes do projeto
const ROOT_DIR = path.join(__dirname, '..');        // raiz do projeto
const JS_DIR   = path.join(ROOT_DIR, 'js');         // /js Pasta estática de scripts
const CSS_DIR  = path.join(__dirname, 'css');       // /src/css Pasta estática de estilos
const INDEX    = path.join(ROOT_DIR, 'index.html'); // HTML principal

const app = express();
const PORT = process.env.PORT || 3000;

// CORS liberado para qualquer origem
app.use(cors({ origin: '*', allowedHeaders: ['Content-Type','Authorization'] }));

// Habilita parsing de JSON no corpo das requisições
app.use(express.json());

// Arquivos estáticos
app.use('/js',  express.static(JS_DIR));  // Servir arquivos em /js
app.use('/css', express.static(CSS_DIR)); // Servir arquivos em /css

// Logs de diagnóstico no startup, feitos para valiadar paths
console.log('[startup]');
console.log('  ROOT_DIR:', ROOT_DIR);
console.log('  INDEX:', INDEX, 'exists=', fs.existsSync(INDEX));
console.log('  JS_DIR:', JS_DIR, 'exists=', fs.existsSync(JS_DIR));
console.log('  CSS_DIR:', CSS_DIR, 'exists=', fs.existsSync(CSS_DIR));

/*
 * Rota raiz: entrega o index.html do frontend.
 * Em caso de erro ao enviar arquivo, retorna status apropriado.
 */
app.get('/', (_req, res) => {
  res.sendFile(INDEX, err => {
    if (err) res.status(err.status || 500).send(err.message);
  });
});

/*
 * Health-check simples para monitoramento.
 * GET /health → { ok: true }
 */
app.get('/health', (_req, res) => res.json({ ok: true }));

/*
 * API protegida por Bearer Token.
 * - Todas as rotas definidas em `router` ficam sob o prefixo /api.
 * - O middleware `auth` valida o cabeçalho Authorization: Bearer <token>.
 */
app.use('/api', auth, router);

// 404 somente para API
app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// handler global de erros, qualquer possivel erro não tratado cai aqui 
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Erro interno' });
});

/*
 * Inicializa o servidor HTTP e, ao subir, testa conexão com o MySQL.
 * Em caso de falha na conexão, loga o erro mas mantém o servidor rodando
 */
app.listen(PORT, async () => {
  try {
    await testConnection();
    console.log(`API on http://localhost:${PORT}`);
  } catch (e) {
    console.error('Falha ao conectar no MySQL:', e.message);
  }
});