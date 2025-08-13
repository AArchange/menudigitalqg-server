// server/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Chaque email doit être unique
  },
  password: {
    type: String,
    required: true,
  },
  restaurantSlug: { // Pour l'URL du menu public, ex: "le-bon-gout"
    type: String,
    required: true,
    unique: true,
  }, 
  logo: { 
    type: String, 
    required: false 
  }, // Le logo est ici
  themeColor: { 
    type: String, 
    required: false, 
    default: '#4f46e5' 
  }, // La couleur est ici
    menuViewCount: {
    type: Number,
    required: true,
    default: 0, // Le compteur commence à 0
  },
}, {
  timestamps: true,
});

// Cette fonction s'exécute AVANT de sauvegarder un utilisateur
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer le mot de passe entré avec celui dans la DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;