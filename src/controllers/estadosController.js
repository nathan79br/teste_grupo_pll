// src/controllers/estadosController.js
import { pool } from '../database/connection.js';

export async function listarEstados(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, uf FROM estado ORDER BY nome'
    );
    res.json(rows);
  } catch (e) {
    console.error('listarEstados:', e);
    res.status(500).json({ message: 'Erro ao listar estados' });
  }
}

export async function obterEstadoPorUf(req, res) {
  const uf = String(req.params.uf || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) {
    return res.status(400).json({ message: 'UF inválida' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, uf FROM estado WHERE uf = ?',
      [uf]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Estado não encontrado' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('obterEstadoPorUf:', e);
    res.status(500).json({ message: 'Erro ao buscar estado' });
  }
}