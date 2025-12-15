import { pool } from '../database/connection.js';

export async function listarCidades(req, res) {
  const [rows] = await pool.query('SELECT id, nome, estado_uf FROM cidade ORDER BY nome');
  res.json(rows);
}

export async function obterCidade(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT id, nome, estado_uf FROM cidade WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ message: 'Cidade não encontrada' });
  res.json(rows[0]);
}

export async function criarCidade(req, res) {
  let { nome, estado_uf } = req.body || {};
  nome = String(nome || '').trim();
  estado_uf = String(estado_uf || '').trim().toUpperCase();

  if (!nome || !estado_uf) return res.status(400).json({ message: 'nome e estado_uf são obrigatórios' });

  const [[ufExiste]] = await pool.query('SELECT uf FROM estado WHERE uf=?', [estado_uf]);
  if (!ufExiste) return res.status(404).json({ message: 'UF inexistente' });

  try {
    const [r] = await pool.query('INSERT INTO cidade (nome, estado_uf) VALUES (?, ?)', [nome, estado_uf]);
    res.status(201).json({ id: r.insertId, nome, estado_uf });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Cidade já existe nesta UF' });
    res.status(400).json({ message: 'Erro ao criar cidade', detail: e.message });
  }
}

export async function atualizarCidade(req, res) {
  const { id } = req.params;
  let { nome, estado_uf } = req.body || {};
  nome = String(nome || '').trim();
  estado_uf = String(estado_uf || '').trim().toUpperCase();

  if (!nome || !estado_uf) return res.status(400).json({ message: 'nome e estado_uf são obrigatórios' });

  const [[ufExiste]] = await pool.query('SELECT uf FROM estado WHERE uf=?', [estado_uf]);
  if (!ufExiste) return res.status(404).json({ message: 'UF inexistente' });

  try {
    const [r] = await pool.query('UPDATE cidade SET nome=?, estado_uf=? WHERE id=?', [nome, estado_uf, id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Cidade não encontrada' });
    res.json({ id: Number(id), nome, estado_uf });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Cidade já existe nesta UF' });
    res.status(400).json({ message: 'Erro ao atualizar cidade', detail: e.message });
  }
}

export async function removerCidade(req, res) {
  const { id } = req.params;
  const [r] = await pool.query('DELETE FROM cidade WHERE id = ?', [id]);
  if (!r.affectedRows) return res.status(404).json({ message: 'Cidade não encontrada' });
  res.status(204).end();
}
