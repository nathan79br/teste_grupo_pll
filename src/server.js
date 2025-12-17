import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { testConnection } from './database/connection.js';
import { auth } from './middlewares/auth.js';
import { router } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');        // pasta do projeto
const JS_DIR   = path.join(ROOT_DIR, 'js');         // /js
const CSS_DIR  = path.join(__dirname, 'css');       // /src/css
const INDEX    = path.join(ROOT_DIR, 'index.html'); // /index.html

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

// estáticos
app.use('/js',  express.static(JS_DIR));
app.use('/css', express.static(CSS_DIR));

// debug opcional
console.log('[startup]');
console.log('  ROOT_DIR:', ROOT_DIR);
console.log('  INDEX:', INDEX, 'exists=', fs.existsSync(INDEX));
console.log('  JS_DIR:', JS_DIR, 'exists=', fs.existsSync(JS_DIR));
console.log('  CSS_DIR:', CSS_DIR, 'exists=', fs.existsSync(CSS_DIR));

// rota raiz -> index.html
app.get('/', (_req, res) => {
  res.sendFile(INDEX, err => {
    if (err) res.status(err.status || 500).send(err.message);
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// API protegida
app.use('/api', auth, router);

// 404 somente para API
app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// handler de erros
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Erro interno' });
});

app.listen(PORT, async () => {
  try {
    await testConnection();
    console.log(`API on http://localhost:${PORT}`);
  } catch (e) {
    console.error('Falha ao conectar no MySQL:', e.message);
  }
});