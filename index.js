// server/index.js

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// On importe nos fichiers de routes bien séparés
const dishRoutes = require('./routes/dishRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API du Menu Digital QG fonctionne !');
});

// On dit à Express d'utiliser chaque routeur pour son chemin spécifique
app.use('/api/dishes', dishRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});