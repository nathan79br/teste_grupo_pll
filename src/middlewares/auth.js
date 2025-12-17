/**
 * Middleware de autenticação Bearer para a API.
 * Funcionamento:
 * - Lê o cabeçalho Authorization no formato "Bearer <token>".
 * - Verifica se o servidor possui a variável de ambiente API_TOKEN.
 * - Compara o token recebido com process.env.API_TOKEN.
 * - Em caso de ausência/erro, retorna JSON com status adequado.
 * - Em caso de sucesso, chama next() para seguir para a rota.
 *
 * Códigos de retorno:
 * - 401 Token não informado ou inválido.
 * - 500 API_TOKEN não configurado no servidor.
 *
 * @param {import('express').Request} req         //Objeto da requisição
 * @param {import('express').Response} res        //Objeto da resposta
 * @param {import('express').NextFunction} next   //Próximo middleware/handler
 */
export function auth(req, res, next) {
   // Captura o header "Authorization". Pode vir undefined; por isso o fallback '
  const header = req.headers.authorization || '';
  // Espera o esquema "Bearer" e o token separado por espaço: "Bearer <token>"
  const [scheme, token] = header.split(' ');

  // Falta de header ou formato diferente de "Bearer <token>"
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token não informado' });
  }

  // Falta configurar a variável de ambiente no servidor
  if (!process.env.API_TOKEN) {
    return res.status(500).json({ error: 'API_TOKEN não configurado no servidor' });
  }

  // Token diferente do esperado
  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Autenticado: segue para a próxima camada
  next();
}