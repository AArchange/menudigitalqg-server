// server/models/dishModel.js

const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    user: { // <-- CHAMP AJOUTÉ
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Fait référence à notre modèle User
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Entrée', 'Plat de résistance', 'Dessert', 'Boisson'],
  },
  // --- LE CHAMP MANQUANT EST AJOUTÉ ICI ---
  isAvailable: {
    type: Boolean,
    required: true,
    default: true, // Très important : tout nouveau plat sera disponible par défaut
  },
}, {
  timestamps: true,
});

const Dish = mongoose.model('Dish', dishSchema);

module.exports = Dish;