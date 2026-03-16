const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Middleware: vérifier le token JWT ───────────────────
const proteger = async (req, res, next) => {
  try {
    // 1. Récupérer le token depuis le header Authorization
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Veuillez vous connecter.'
      });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable. Token invalide.'
      });
    }

    if (!user.actif) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez Taslima.'
      });
    }

    // 4. Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token invalide.'
    });
  }
};

// ─── Middleware: restreindre par rôle ────────────────────
const autoriser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// ─── Générer un JWT ──────────────────────────────────────
const genererToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { proteger, autoriser, genererToken };
