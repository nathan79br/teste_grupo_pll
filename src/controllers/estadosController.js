import { pool } from '../database/connection.js';

export async function listarEstados(req, res) {
  const [rows] = await pool.query('SELECT id, nome, uf FROM estado ORDER BY nome');
  res.json(rows);
}

export async function obterEstadoPorUf(req, res) {
  const { uf } = req.params;
  const [rows] = await pool.query('SELECT id, nome, uf FROM estado WHERE uf = ?', [uf.toUpperCase()]);
  if (!rows.length) return res.status(404).json({ message: 'Estado não encontrado' });
  res.json(rows[0]);
}
