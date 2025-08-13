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

module.exports = router;