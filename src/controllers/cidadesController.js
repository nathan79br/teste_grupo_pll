/**
 * Controller de Cidades.
 * Responsabilidades:
 * - Listar cidades com paginação simples
 * - Obter cidade por ID
 * - Criar, atualizar e remover cidades
 *
 * Códigos de retorno utilizados:
 * - 200 Sucesso
 * - 201 Criado
 * - 204 Sem conteúdo (remoção)
 * - 400 Requisição inválida (validação)
 * - 404 Não encontrado
 * - 409 Conflito (duplicidade)
 * - 500 Erro interno ao acessar o banco
 */
import { pool } from '../database/connection.js';

/**
 * Lista cidades com paginação.
 * Rota: GET /api/cidades
 *
 * Respostas:
 * - 200: Cidade[] em JSON
 * - 500: { message: 'Erro ao listar cidades' }
 */
export async function listarCidades(req, res) {
  // Paginação simples
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '100', 10)));
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, estado_uf FROM cidade ORDER BY nome LIMIT ? OFFSET ?',
      [limit, offset]
    );
    res.json(rows);
  } catch (e) {
    console.error('listarCidades:', e);
    res.status(500).json({ message: 'Erro ao listar cidades' });
  }
}

/**
 * Obtém uma cidade pelo ID.
 * Rota: GET /api/cidades/:id
 *
 * Validações:
 * - id deve ser inteiro
 *
 * Respostas:
 * - 200: Cidade em JSON
 * - 400: { message: 'id inválido' }
 * - 404: { message: 'Cidade não encontrada' }
 * - 500: { message: 'Erro ao buscar cidade' }
 */
export async function obterCidade(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'id inválido' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, estado_uf FROM cidade WHERE id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Cidade não encontrada' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('obterCidade:', e);
    res.status(500).json({ message: 'Erro ao buscar cidade' });
  }
}

/**
 * Cria uma nova cidade.
 * Rota: POST /api/cidades
 *
 * Regras:
 * - Normaliza estado_uf para maiúsculas
 * - Valida obrigatoriedade dos campos
 * - Verifica existência da UF na tabela estado
 * - Trata duplicidade (constraint única, ex.: (nome, estado_uf))
 *
 * Respostas:
 * - 201: { id, nome, estado_uf }
 * - 400: { message: 'Erro ao criar cidade', detail? }
 * - 404: { message: 'UF inexistente' }
 * - 409: { message: 'Cidade já existe nesta UF' }
 */
export async function criarCidade(req, res) {
  let { nome, estado_uf } = req.body || {};
  nome = String(nome || '').trim();
  estado_uf = String(estado_uf || '').trim().toUpperCase();

  if (!nome || !estado_uf) {
    return res.status(400).json({ message: 'nome e estado_uf são obrigatórios' });
  }

  try {
    // Garante que a UF existe na tabela estado
    const [[ufExiste]] = await pool.query(
      'SELECT uf FROM estado WHERE uf = ?',
      [estado_uf]
    );
    if (!ufExiste) {
      return res.status(404).json({ message: 'UF inexistente' });
    }

    // Inserção
    const [r] = await pool.query(
      'INSERT INTO cidade (nome, estado_uf) VALUES (?, ?)',
      [nome, estado_uf]
    );
    res.status(201).json({ id: r.insertId, nome, estado_uf });
    // Violação de chave única (duplicidade)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Cidade já existe nesta UF' });
    }
    console.error('criarCidade:', e);
    res.status(400).json({ message: 'Erro ao criar cidade', detail: e.message });
  }
}

/**
 * Atualiza uma cidade existente.
 * Rota: PUT /api/cidades/:id
 *
 * Regras:
 * - Normaliza estado_uf para maiúsculas
 * - Valida id e campos obrigatórios
 * - Verifica existência da UF
 * - Trata duplicidade
 *
 * Respostas:
 * - 200: { id, nome, estado_uf }
 * - 400: { message: 'id inválido' | 'nome e estado_uf são obrigatórios' | 'Erro ao atualizar cidade' }
 * - 404: { message: 'UF inexistente' | 'Cidade não encontrada' }
 * - 409: { message: 'Cidade já existe nesta UF' }
 */
export async function atualizarCidade(req, res) {
  const id = parseInt(req.params.id, 10);
  let { nome, estado_uf } = req.body || {};
  nome = String(nome || '').trim();
  estado_uf = String(estado_uf || '').trim().toUpperCase();

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'id inválido' });
  }
  if (!nome || !estado_uf) {
    return res.status(400).json({ message: 'nome e estado_uf são obrigatórios' });
  }

  try {
    // Garante que a UF existe
    const [[ufExiste]] = await pool.query(
      'SELECT uf FROM estado WHERE uf = ?',
      [estado_uf]
    );
    if (!ufExiste) {
      return res.status(404).json({ message: 'UF inexistente' });
    }

    // Atualização
    const [r] = await pool.query(
      'UPDATE cidade SET nome = ?, estado_uf = ? WHERE id = ?',
      [nome, estado_uf, id]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ message: 'Cidade não encontrada' });
    }
    res.json({ id, nome, estado_uf });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Cidade já existe nesta UF' });
    }
    console.error('atualizarCidade:', e);
    res.status(400).json({ message: 'Erro ao atualizar cidade', detail: e.message });
  }
}

/**
 * Remove uma cidade por ID.
 * Rota: DELETE /api/cidades/:id
 *
 * Validações:
 * - id deve ser inteiro
 *
 * Respostas:
 * - 204: sucesso sem corpo
 * - 400: { message: 'id inválido' }
 * - 404: { message: 'Cidade não encontrada' }
 * - 400: { message: 'Erro ao remover cidade', detail? } (erros do driver)
 */
export async function removerCidade(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'id inválido' });
  }

  try {
    const [r] = await pool.query('DELETE FROM cidade WHERE id = ?', [id]);
    if (!r.affectedRows) {
      return res.status(404).json({ message: 'Cidade não encontrada' });
    }
    res.status(204).end();
  } catch (e) {
    console.error('removerCidade:', e);
    res.status(400).json({ message: 'Erro ao remover cidade', detail: e.message });
  }
}