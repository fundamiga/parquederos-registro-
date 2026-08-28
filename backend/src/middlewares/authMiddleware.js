// Middleware libre para acceso directo
const authMiddleware = (req, res, next) => {
  next();
};

module.exports = authMiddleware;