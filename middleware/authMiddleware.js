// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;
  
  // Le jeton sera envoyé dans les en-têtes comme "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // On attache l'utilisateur (sans le mot de passe) à la requête
      // pour que les routes suivantes puissent l'utiliser
      req.user = await User.findById(decoded.id).select('-password');
      
      next(); // Passe à la prochaine étape (la route elle-même)
    } catch (error) {
      res.status(401).json({ message: 'Non autorisé, jeton invalide' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, pas de jeton' });
  }
};

 // Nouvelle vérification :
  const user = await User.findById(decoded.id).select('-password');
  if (user.subscriptionStatus !== 'actif') {
    return res.status(403).json({ message: 'Abonnement inactif. Veuillez vous abonner.' });
  }

  // Vérifier si l'abonnement n'a pas expiré
  if (user.subscriptionExpiresAt && new Date() > user.subscriptionExpiresAt) {
    user.subscriptionStatus = 'expiré';
    await user.save();
    return res.status(403).json({ message: 'Votre abonnement a expiré.' });
  }

  req.user = user;
  next();

module.exports = { protect };