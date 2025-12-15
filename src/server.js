import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './database/connection.js';
import { auth } from './middlewares/auth.js';
import { router } from './routes/index.js';

const app = express();

app.use(cors({ origin: '*', allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

// opcional: servir sua UI. Se mover seu index.html para "public/":
// app.use(express.static('public'));
// Se quiser servir a raiz atual (onde está o index.html):
// app.use(express.static('.'));

// healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// protegendo a API por token fixo
app.use(auth);
app.use(router);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  try { await testConnection(); console.log(`API on http://localhost:${port}`); }
  catch (e) { console.error('Falha ao conectar no MySQL:', e.message); }
});
