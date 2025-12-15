export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token não informado' });
  }

  if (!process.env.API_TOKEN) {
    return res.status(500).json({ error: 'API_TOKEN não configurado no servidor' });
  }

  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  next();
}