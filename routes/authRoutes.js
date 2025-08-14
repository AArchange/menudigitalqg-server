const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// 🔐 Middleware de protection JWT
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le token est dans l'en-tête Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé, token manquant' });
    }
    
    try {
      // Décoder le token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Récupérer l'utilisateur à partir de l'ID décodé
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }
      
      next();
    } catch (jwtError) {
      console.error('Erreur JWT:', jwtError);
      return res.status(401).json({ message: 'Token invalide' });
    }
    
  } catch (error) {
    console.error('Erreur middleware protect:', error);
    return res.status(500).json({ message: 'Erreur serveur dans l\'authentification' });
  }
};

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
    const restaurantSlug = restaurantName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/^-+|-+$/g, ''); // Supprimer les tirets en début/fin

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const slugExists = await User.findOne({ restaurantSlug });
    if (slugExists) {
      return res.status(400).json({ 
        message: 'Ce nom de restaurant existe déjà, veuillez en choisir un autre' 
      });
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
        restaurantSlug: user.restaurantSlug,
        token: generateToken(user._id),
        menuViewCount: user.menuViewCount || 0,
        subscriptionStatus: user.subscriptionStatus || 'inactif',
        subscriptionExpiresAt: user.subscriptionExpiresAt
      });
    } else {
      res.status(400).json({ message: 'Données utilisateur invalides' });
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: "Erreur du serveur lors de l'inscription" });
  }
});

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez fournir email et mot de passe' });
    }
    
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        restaurantName: user.restaurantName,
        email: user.email,
        restaurantSlug: user.restaurantSlug,
        token: generateToken(user._id),
        menuViewCount: user.menuViewCount || 0,
        subscriptionStatus: user.subscriptionStatus || 'inactif',
        subscriptionExpiresAt: user.subscriptionExpiresAt
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ message: "Erreur du serveur lors de la connexion" });
  }
});

// @desc    Vérifier le token de l'utilisateur connecté
// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      _id: user._id,
      restaurantName: user.restaurantName,
      email: user.email,
      restaurantSlug: user.restaurantSlug,
      menuViewCount: user.menuViewCount || 0,
      subscriptionStatus: user.subscriptionStatus || 'inactif',
      subscriptionExpiresAt: user.subscriptionExpiresAt
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @desc    Vérifier une transaction Kkiapay et activer un abonnement
// @route   POST /api/auth/verify
router.post('/verify', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'ID de transaction requis' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Étape 1 : Appeler l'API de Kkiapay pour vérifier la transaction
    const kkiapayResponse = await axios.post('https://api.kkiapay.com/api/v1/transactions/verify', 
      { transaction_id: transactionId },
      { 
        headers: { 
          'Authorization': `Bearer ${process.env.KKIAPAY_SECRET_KEY}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    // Étape 2 : Si Kkiapay confirme que le paiement est "SUCCESS"
    if (kkiapayResponse.data.status === 'SUCCESS') {
      user.subscriptionStatus = 'actif';
      
      // Calculer la date d'expiration (30 jours à partir de maintenant)
      const now = new Date();
      user.subscriptionExpiresAt = new Date(now.setDate(now.getDate() + 30));
      user.kkiapayTransactionId = transactionId;
      
      await user.save();
      
      res.json({ 
        message: 'Abonnement activé avec succès !',
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      });
    } else {
      throw new Error('Transaction invalide ou échouée');
    }

  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    
    if (error.response) {
      // Erreur de l'API Kkiapay
      res.status(400).json({ 
        message: "Erreur lors de la vérification avec Kkiapay",
        details: error.response.data
      });
    } else {
      res.status(500).json({ 
        message: "La vérification du paiement a échoué",
        error: error.message
      });
    }
  }
});

// @desc    Vérifier le statut d'abonnement
// @route   GET /api/auth/subscription-status
router.get('/subscription-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Vérifier si l'abonnement a expiré
    const now = new Date();
    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < now) {
      user.subscriptionStatus = 'expiré';
      await user.save();
    }
    
    res.json({
      subscriptionStatus: user.subscriptionStatus || 'inactif',
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      daysRemaining: user.subscriptionExpiresAt 
        ? Math.max(0, Math.ceil((user.subscriptionExpiresAt - now) / (1000 * 60 * 60 * 24)))
        : 0
    });
  } catch (error) {
    console.error('Erreur vérification abonnement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;