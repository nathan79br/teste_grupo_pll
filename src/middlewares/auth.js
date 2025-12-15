module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não informado' });
  }

  if (authHeader !== `Bearer ${process.env.API_TOKEN}`) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  next();
};
