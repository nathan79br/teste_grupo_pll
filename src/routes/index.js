/*
 * Router principal da API.
 * Prefixo: /api (definido em server/app: app.use('/api', auth, router))
 * Segurança: todas as rotas abaixo exigem Authorization: Bearer <API_TOKEN>.
 *
 * Endpoints:
 * - GET    /api/estados               → listarEstados
 * - GET    /api/estados/:uf           → obterEstadoPorUf
 * - GET    /api/cidades               → listarCidades   (suporta ?limit=, ?page=, etc. se implementado)
 * - GET    /api/cidades/:id           → obterCidade
 * - POST   /api/cidades               → criarCidade      (body: { nome, estado_uf })
 * - PUT    /api/cidades/:id           → atualizarCidade  (body: { nome, estado_uf })
 * - DELETE /api/cidades/:id           → removerCidade
 */
import { Router } from 'express';
import { listarEstados, obterEstadoPorUf } from '../controllers/estadosController.js';
import { listarCidades, obterCidade, criarCidade, atualizarCidade, removerCidade } from '../controllers/cidadesController.js';

export const router = Router();

// Estados
/*
 * Lista todos os estados.
 * GET /api/estados
 */
router.get('/estados', listarEstados);

/*
 * Obtém um estado pela sigla da UF (ex.: SP).
 * GET /api/estados/:uf
 */
router.get('/estados/:uf', obterEstadoPorUf);

// Cidades
/*
 * Lista cidades.
 * GET /api/cidades
 */
router.get('/cidades', listarCidades);

/*
 * Obtém uma cidade pelo ID.
 * GET /api/cidades/:id
 */
router.get('/cidades/:id', obterCidade);

/*
 * Cria uma nova cidade.
 * POST /api/cidades
 */
router.post('/cidades', criarCidade);

/*
 * Atualiza uma cidade existente.
 * PUT /api/cidades/:id
 */
router.put('/cidades/:id', atualizarCidade);

/*
 * Remove uma cidade pelo ID.
 * DELETE /api/cidades/:id
 */
router.delete('/cidades/:id', removerCidade);

export default router;