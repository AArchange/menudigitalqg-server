// server/index.js

// 1. CHARGER LES VARIABLES D'ENVIRONNEMENT
const dotenv = require('dotenv');
dotenv.config();

// 2. IMPORTER LES MODULES
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dishRoutes = require('./routes/dishRoutes');
const authRoutes = require('./routes/authRoutes'); // On importe bien les routes d'authentification

// 3. CONNECTER LA BASE DE DONNÉES
connectDB();

// 4. CRÉER L'APPLICATION EXPRESS
const app = express();
const PORT = process.env.PORT || 3001;

// 5. APPLIQUER LES MIDDLEWARES (indispensable AVANT les routes)
app.use(cors());
app.use(express.json());

// 6. DÉFINIR LES ROUTES
// Route de test simple
app.get('/', (req, res) => {
  res.send('API du Menu Digital QG fonctionne !');
});

// Routes pour les plats (préfixe /api/dishes)
app.use('/api/dishes', dishRoutes);

// Routes pour l'authentification (préfixe /api/auth)
app.use('/api/auth', authRoutes);

// 7. DÉMARRER LE SERVEUR
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});