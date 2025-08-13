// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { protect } = require('../middleware/authMiddleware');

// @desc    Récupérer les informations du profil de l'utilisateur
// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
});

// @desc    Mettre à jour le profil de l'utilisateur
// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.restaurantName = req.body.restaurantName || user.restaurantName;
    user.logo = req.body.logo; // Permet de supprimer le logo si on envoie une chaîne vide
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
});

module.exports = router;