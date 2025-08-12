// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// @desc    Inscrire un nouvel utilisateur (restaurant)
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { restaurantName, email, password } = req.body;

  // Créer un "slug" simple pour l'URL du restaurant
  const restaurantSlug = restaurantName.toLowerCase().replace(/\s+/g, '-');

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'Cet email est déjà utilisé' });
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
      token: generateToken(user._id), // On lui donne un jeton dès l'inscription
    });
  } else {
    res.status(400).json({ message: 'Données utilisateur invalides' });
  }
});

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      restaurantName: user.restaurantName,
      email: user.email,
      restaurantSlug: user.restaurantSlug,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }
});

module.exports = router;