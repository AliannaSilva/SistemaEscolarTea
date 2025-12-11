// middlewares/roles.js
function permitirTipos(...tipos) {
  return (req, res, next) => {
    const userTipo = req.user?.tipo;
    if (!userTipo) return res.status(401).json({ error: 'Usuário não autenticado' });
    if (!tipos.includes(userTipo)) return res.status(403).json({ error: 'Permissão negada' });
    next();
  };
}

module.exports = { permitirTipos };
