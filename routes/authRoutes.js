const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// @desc    Inscrire un nouvel utilisateur (restaurant)
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { restaurantName, email, password } = req.body;

    // Vérification simple des entrées
    if (!restaurantName || !email || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    // Créer un "slug" simple pour l'URL du restaurant
    const restaurantSlug = restaurantName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const slugExists = await User.findOne({ restaurantSlug });
    if (slugExists) {
      return res.status(400).json({ message: 'Ce nom de restaurant existe déjà, veuillez en choisir un autre' });
    }

    const user = await User.create({
      restaurantName,
      email,
      password,
      restaurantSlug,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        restaurantName: user.restaurantName,
        email: user.email,
        restaurantSlug: user.restaurantSlug, // <-- LA CORRECTION EST ICI
        token: generateToken(user._id),
        menuViewCount: user.menuViewCount // <-- AJOUTER ICI
      });
    } else {
      res.status(400).json({ message: 'Données utilisateur invalides' });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur lors de l'inscription" });
  }
});

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        restaurantName: user.restaurantName,
        email: user.email,
        restaurantSlug: user.restaurantSlug,
        token: generateToken(user._id),
        menuViewCount: user.menuViewCount 
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur lors de la connexion" });
  }
});

// @desc    Vérifier une transaction Kkiapay et activer un abonnement
// @route   POST /api/payments/verify
router.post('/verify', protect, async (req, res) => {
  const { transactionId } = req.body;
  const user = await User.findById(req.user._id);

  try {
    // Étape 1 : Appeler l'API de Kkiapay pour vérifier la transaction
    // (Ceci est un pseudo-code, il faudra voir la doc de Kkiapay)
    const kkiapayResponse = await axios.post('https://api.kkiapay.com/api/v1/transactions/verify', 
      { transaction_id: transactionId },
      { headers: { 'Authorization': `Bearer ${process.env.KKIAPAY_SECRET_KEY}` } }
    );

    // Étape 2 : Si Kkiapay confirme que le paiement est "SUCCESS"
    if (user && kkiapayResponse.data.status === 'SUCCESS') {
      user.subscriptionStatus = 'actif';
      // On calcule la date d'expiration (ex: 30 jours à partir de maintenant)
      const now = new Date();
      user.subscriptionExpiresAt = new Date(now.setDate(now.getDate() + 30));
      user.kkiapayTransactionId = transactionId;
      
      await user.save();
      res.json({ message: 'Abonnement activé avec succès !' });
    } else {
      throw new Error('Transaction invalide ou échouée.');
    }

  } catch (error) {
    res.status(400).json({ message: "La vérification du paiement a échoué." });
  }
});

module.exports = router;