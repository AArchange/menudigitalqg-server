// server/index.js

// 1. CHARGER LES VARIABLES D'ENVIRONNEMENT
const dotenv = require('dotenv');
dotenv.config();

// 2. IMPORTER LES MODULES
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dishRoutes = require('./routes/dishRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// 3. CONNECTER LA BASE DE DONNÉES
connectDB();

// 4. CRÉER L'APPLICATION EXPRESS
const app = express();
const PORT = process.env.PORT || 3001;

// 5. APPLIQUER LES MIDDLEWARES
app.use(cors());
app.use(express.json());

// 6. DÉFINIR LES ROUTES
app.get('/', (req, res) => {
  res.send('API du Menu Digital QG fonctionne !');
});

app.use('/api/dishes', dishRoutes);
app.use('/api/auth', authRoutes); // Contient register, login, et profile
app.use('/api/payments', paymentRoutes); // Contient la vérification de paiement

// 7. DÉMARRER LE SERVEUR
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});