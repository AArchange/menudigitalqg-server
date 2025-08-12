const express = require('express');
const router = express.Router();
const Dish = require('../models/dishModel');
const User = require('../models/userModel'); // On aura besoin de User pour la route publique
const { protect } = require('../middleware/authMiddleware'); // On importe notre gardien

// ====================================================================
// Routes Protégées (nécessitent d'être connecté)
// ====================================================================

// @desc    Créer un nouveau plat pour l'utilisateur connecté
// @route   POST /api/dishes
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const newDish = new Dish({
      user: req.user._id, // On lie le plat à l'ID de l'utilisateur qui fait la requête
      name,
      description,
      price,
      category,
    });
    const createdDish = await newDish.save();
    res.status(201).json(createdDish);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la création du plat" });
  }
});

// @desc    Récupérer tous les plats de l'utilisateur connecté
// @route   GET /api/dishes
router.get('/', protect, async (req, res) => {
  try {
    const dishes = await Dish.find({ user: req.user._id }); // On ne cherche que les plats où le champ 'user' correspond à l'ID de l'utilisateur connecté
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la récupération des plats" });
  }
});

// @desc    Mettre à jour un plat appartenant à l'utilisateur connecté
// @route   PUT /api/dishes/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const dish = await Dish.findById(req.params.id);

    // Vérification de sécurité : le plat existe ET il appartient bien à l'utilisateur connecté
    if (dish && dish.user.toString() === req.user._id.toString()) {
      dish.name = name || dish.name;
      dish.description = description || dish.description;
      dish.price = price || dish.price;
      dish.category = category || dish.category;
      
      const updatedDish = await dish.save();
      res.json(updatedDish);
    } else {
      res.status(404).json({ message: 'Plat non trouvé ou vous n\'êtes pas autorisé à le modifier' });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du plat" });
  }
});

// @desc    Supprimer un plat appartenant à l'utilisateur connecté
// @route   DELETE /api/dishes/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (dish && dish.user.toString() === req.user._id.toString()) {
      await dish.deleteOne();
      res.json({ message: 'Plat supprimé avec succès' });
    } else {
      res.status(404).json({ message: 'Plat non trouvé ou vous n\'êtes pas autorisé à le supprimer' });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la suppression du plat" });
  }
});

// @desc    Changer le statut de disponibilité d'un plat appartenant à l'utilisateur connecté
// @route   PATCH /api/dishes/:id/toggle
router.patch('/:id/toggle', protect, async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (dish && dish.user.toString() === req.user._id.toString()) {
      dish.isAvailable = !dish.isAvailable;
      await dish.save();
      res.json({ message: 'Statut mis à jour', isAvailable: dish.isAvailable });
    } else {
      res.status(404).json({ message: 'Plat non trouvé ou vous n\'êtes pas autorisé à modifier son statut' });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors du changement de statut" });
  }
});


// ====================================================================
// Route Publique (pas besoin d'être connecté)
// ====================================================================

// @desc    Récupérer le menu d'un restaurant par son slug
// @route   GET /api/dishes/menu/:slug
router.get('/menu/:slug', async (req, res) => {
  try {
    // 1. Trouver l'utilisateur (le restaurant) grâce à son slug
    const user = await User.findOne({ restaurantSlug: req.params.slug });

    if (!user) {
      return res.status(404).json({ message: 'Restaurant non trouvé' });
    }

    // 2. Trouver tous les plats qui appartiennent à cet utilisateur
    const dishes = await Dish.find({ user: user._id });
    res.json(dishes);
    
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la récupération du menu" });
  }
});

module.exports = router;