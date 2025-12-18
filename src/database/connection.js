/*
 * Configuração de conexão com MySQL usando mysql2/promise.
 * Responsabilidades:
 * - Carregar variáveis de ambiente (.env) para montar o Pool.
 * - Exportar um Pool reutilizável para toda a aplicação.
 * - Fornecer um utilitário `testConnection()` para health-check/startup.
 */
import 'dotenv/config';
import { createPool } from 'mysql2/promise';

export const pool = createPool({
  host: process.env.DB_HOST,      // endereço do servidor MySQL
  user: process.env.DB_USER,      // usuário
  password: process.env.DB_PASS,  // senha
  database: process.env.DB_NAME,  // schema
  waitForConnections: true,       // se exceder o limite, entra em fila em vez de lançar erro
  connectionLimit: 10             // número máximo de conexões simultâneas no pool
});

/**
 * Faz um ping no banco para verificar conectividade.
 * Fluxo:
 * - Obtém uma conexão do pool
 * - Executa `ping()`
 * - Sempre libera a conexão (release), mesmo em erro
 */
export async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}