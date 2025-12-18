/**
 * Controller de Estados.
 * Responsabilidades:
 * - Listar todos os estados
 * - Obter um estado pela sigla da UF
 *
 * Códigos de retorno utilizados:
 * - 200 Sucesso
 * - 400 Requisição inválida (ex.: UF inválida)
 * - 404 Não encontrado
 * - 500 Erro interno ao acessar o banco
 */
import { pool } from '../database/connection.js';

/**
 * Lista todos os estados ordenados por nome.
 * Rota: GET /api/estados
 *
 * Respostas:
 * - 200: Estado[] em JSON
 * - 500: { message: 'Erro ao listar estados' }
 */
export async function listarEstados(req, res) {
  try {
    // Consulta simples ordenada por nome
    const [rows] = await pool.query(
      'SELECT id, nome, uf FROM estado ORDER BY nome'
    );
    // retorna array de estados
    res.json(rows);
  } catch (e) {
    console.error('listarEstados:', e);
    res.status(500).json({ message: 'Erro ao listar estados' });
  }
}

/**
 * Obtém um estado pela sigla da UF (ex.: 'SP').
 * Rota: GET /api/estados/:uf
 *
 * Validações:
 * - UF deve ter exatamente 2 letras (A-Z)
 *
 * Respostas:
 * - 200: Estado em JSON
 * - 400: { message: 'UF inválida' }
 * - 404: { message: 'Estado não encontrado' }
 * - 500: { message: 'Erro ao buscar estado' }
 */
export async function obterEstadoPorUf(req, res) {
  // Normaliza a UF para maiúsculas e valida formato AA
  const uf = String(req.params.uf || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) {
    return res.status(400).json({ message: 'UF inválida' });
  }

  try {
    // Consulta parametrizada para evitar SQL Injection
    const [rows] = await pool.query(
      'SELECT id, nome, uf FROM estado WHERE uf = ?',
      [uf]
    );
    // Não encontrado
    if (!rows.length) {
      return res.status(404).json({ message: 'Estado não encontrado' });
    }
    // Retorna o primeiro registro (UF é única)
    res.json(rows[0]);
  } catch (e) {
    console.error('obterEstadoPorUf:', e);
    res.status(500).json({ message: 'Erro ao buscar estado' });
  }
}