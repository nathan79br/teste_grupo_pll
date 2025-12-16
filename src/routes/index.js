import { Router } from 'express';
import { listarEstados, obterEstadoPorUf } from '../controllers/estadosController.js';
import { listarCidades, obterCidade, criarCidade, atualizarCidade, removerCidade } from '../controllers/cidadesController.js';

export const router = Router();

// Estados
router.get('/estados', listarEstados);
router.get('/estados/:uf', obterEstadoPorUf);

// Cidades
router.get('/cidades', listarCidades);
router.get('/cidades/:id', obterCidade);
router.post('/cidades', criarCidade);
router.put('/cidades/:id', atualizarCidade);
router.delete('/cidades/:id', removerCidade);

export default router;