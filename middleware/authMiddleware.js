// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// On ajoute "async" ici
const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      
      // Si l'utilisateur n'existe plus (ex: supprimé)
      if (!user) {
        return res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé' });
      }

      // Vérification de l'abonnement
      if (user.subscriptionStatus !== 'actif') {
        // Exception pour la page de profil, pour qu'un utilisateur puisse voir ses infos même si abonnement inactif
        const isProfileRoute = req.originalUrl.includes('/api/users/profile');
        if (!isProfileRoute) {
          return res.status(403).json({ message: 'Abonnement inactif. Veuillez vous abonner.' });
        }
      }

      // Vérifier si l'abonnement n'a pas expiré
      if (user.subscriptionExpiresAt && new Date() > new Date(user.subscriptionExpiresAt)) {
        if (user.subscriptionStatus !== 'expiré') { // On met à jour une seule fois
           user.subscriptionStatus = 'expiré';
           await user.save({ validateBeforeSave: false }); // On sauvegarde sans re-valider le mot de passe
        }
        
        const isProfileRoute = req.originalUrl.includes('/api/users/profile');
        const isPaymentRoute = req.originalUrl.includes('/api/payments');
        if (!isProfileRoute && !isPaymentRoute) {
            return res.status(403).json({ message: 'Votre abonnement a expiré.' });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Non autorisé, jeton invalide' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, pas de jeton' });
  }
};

module.exports = { protect };