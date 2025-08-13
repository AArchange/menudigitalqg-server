// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { protect } = require('../middleware/authMiddleware');
const generateToken = require('../utils/generateToken'); // <-- LA LIGNE QUI MANQUAIT

// @desc    Récupérer les informations du profil de l'utilisateur
// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @desc    Mettre à jour le profil de l'utilisateur
// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.restaurantName = req.body.restaurantName || user.restaurantName;
      // On utilise 'logo' in req.body pour permettre de supprimer le logo en envoyant une chaîne vide
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
        token: generateToken(updatedUser._id), // Maintenant, cette fonction est connue
      });
    } else {
      res.status(4404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @desc    Incrémenter le compteur de vues pour un menu public
// @route   PATCH /api/users/menu/:slug/view
router.patch('/menu/:slug/view', async (req, res) => {
  try {
    // On trouve l'utilisateur par son slug et on incrémente son compteur de 1
    // L'option { new: true } n'est pas nécessaire ici car on ne renvoie rien
    await User.findOneAndUpdate(
      { restaurantSlug: req.params.slug },
      { $inc: { menuViewCount: 1 } }
    );
    // On renvoie un statut 204 "No Content", car on n'a pas besoin de renvoyer de données.
    // C'est une requête "fire-and-forget".
    res.status(204).send();
  } catch (error) {
    // Même si ça échoue, on ne veut pas planter le menu public, donc on renvoie quand même un succès vide.
    res.status(204).send();
  }
});


module.exports = router;