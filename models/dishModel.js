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
  image: {
    type: String,
    required: false, // Une image n'est pas obligatoire
  },
  logo: {
    type: String, // On stockera l'URL de l'image du logo
    required: false,
  },
  themeColor: {
    type: String, // On stockera un code couleur hexadécimal, ex: "#ff5733"
    required: false,
    default: '#4f46e5', // Une couleur par défaut (indigo)
  },
}, {
  timestamps: true,
});

const Dish = mongoose.model('Dish', dishSchema);

module.exports = Dish;