const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { genererToken, proteger } = require('../middleware/auth');

const router = express.Router();

// ─── Helper: envoyer erreurs de validation ───────────────
const valider = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  return null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/auth/inscription
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/inscription', [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 50 }).withMessage('Nom entre 2 et 50 caractères'),
  body('telephone').trim().notEmpty().withMessage('Le téléphone est obligatoire'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('email').optional().isEmail().withMessage('Email invalide')
], async (req, res) => {
  try {
    const erreur = valider(req, res);
    if (erreur) return;

    const { nom, telephone, email, password } = req.body;

    // Vérifier si le téléphone existe déjà
    const existeTel = await User.findOne({ telephone });
    if (existeTel) {
      return res.status(400).json({
        success: false,
        message: 'Ce numéro de téléphone est déjà enregistré.'
      });
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (email) {
      const existeEmail = await User.findOne({ email });
      if (existeEmail) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé.'
        });
      }
    }

    // Créer l'utilisateur (le hash du password est fait dans le model)
    const user = await User.create({ nom, telephone, email, password });
    const token = genererToken(user._id);

    res.status(201).json({
      success: true,
      message: `Bienvenue chez Taslima, ${user.nom} !`,
      token,
      user: user.toPublic()
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/auth/connexion
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/connexion', [
  body('telephone').trim().notEmpty().withMessage('Le téléphone est obligatoire'),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire')
], async (req, res) => {
  try {
    const erreur = valider(req, res);
    if (erreur) return;

    const { telephone, password } = req.body;

    // Chercher l'utilisateur avec son password (select: false par défaut)
    const user = await User.findOne({ telephone }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Téléphone ou mot de passe incorrect.'
      });
    }

    // Vérifier le mot de passe
    const passwordOk = await user.verifierPassword(password);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Téléphone ou mot de passe incorrect.'
      });
    }

    // Mettre à jour la date de dernier accès
    user.dernierAcces = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = genererToken(user._id);

    res.json({
      success: true,
      message: `Content de vous revoir, ${user.nom} !`,
      token,
      user: user.toPublic()
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la connexion.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/auth/moi — Profil de l'utilisateur connecté
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/moi', proteger, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: user.toPublic() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUT /api/auth/modifier — Modifier son profil
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/modifier', proteger, [
  body('nom').optional().trim().isLength({ min: 2 }).withMessage('Nom trop court'),
  body('email').optional().isEmail().withMessage('Email invalide')
], async (req, res) => {
  try {
    const erreur = valider(req, res);
    if (erreur) return;

    const { nom, email } = req.body;
    const updates = {};
    if (nom) updates.nom = nom;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, message: 'Profil mis à jour.', user: user.toPublic() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour.' });
  }
});

module.exports = router;
