const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const axios = require('axios');

// On importe notre gardien partagé depuis son propre fichier
const { protect } = require('../middleware/authMiddleware');

// @desc    Inscrire un nouvel utilisateur (restaurant)
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { restaurantName, email, password } = req.body;

    if (!restaurantName || !email || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    const restaurantSlug = restaurantName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/^-+|-+$/g, '');

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
        restaurantSlug: user.restaurantSlug,
        token: generateToken(user._id),
        menuViewCount: user.menuViewCount || 0,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
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
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ message: "Erreur du serveur lors de la connexion" });
  }
});

// @desc    Récupérer le profil de l'utilisateur connecté (remplace /me)
// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      restaurantName: user.restaurantName,
      email: user.email,
      restaurantSlug: user.restaurantSlug,
      logo: user.logo,
      themeColor: user.themeColor,
      menuViewCount: user.menuViewCount || 0,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @desc    Mettre à jour le profil de l'utilisateur
// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        user.restaurantName = req.body.restaurantName || user.restaurantName;
        user.logo = 'logo' in req.body ? req.body.logo : user.logo;
        user.themeColor = req.body.themeColor || user.themeColor;
  
        const updatedUser = await user.save();
  
        res.json({
          _id: updatedUser._id,
          restaurantName: updatedUser.restaurantName,
          email: updatedUser.email,
          restaurantSlug: updatedUser.restaurantSlug,
          logo: updatedUser.logo,
          themeColor: updatedUser.themeColor,
          token: generateToken(updatedUser._id), // On renvoie un nouveau jeton avec les infos à jour
        });
      } else {
        res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
});


module.exports = router;