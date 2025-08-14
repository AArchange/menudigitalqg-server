const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/userModel');
const { protect } = require('../middleware/authMiddleware');

const plans = {
    mensuel: { amount: 3000, duration: 30 },
    annuel: { amount: 30000, duration: 365 },
};

router.post('/verify', protect, async (req, res) => {
    const { transactionId, planKey } = req.body;
    const user = await User.findById(req.user._id);
    const selectedPlan = plans[planKey];

    if (!transactionId || !user || !selectedPlan) {
        return res.status(400).json({ message: "Données de transaction manquantes ou invalides." });
    }

    try {
        const response = await axios.get(`https://api-sandbox.kkiapay.me/api/v1/transactions/${transactionId}`, {
            headers: { 'x-api-key': process.env.KKIAPAY_PUBLIC_KEY }
        });

        const transaction = response.data;
        
        // Vérifications cruciales de sécurité
        if (transaction.status === 'SUCCESS' && transaction.amount >= selectedPlan.amount && transaction.customer.email === user.email) {
            user.subscriptionType = planKey;
            user.subscriptionStatus = 'actif';
            const now = new Date();
            user.subscriptionExpiresAt = new Date(now.setDate(now.getDate() + selectedPlan.duration));
            user.kkiapayTransactionId = transactionId;
            
            const updatedUser = await user.save();
            res.json({ message: 'Abonnement activé avec succès !', user: updatedUser });
        } else {
            throw new Error('Transaction invalide ou ne correspond pas.');
        }
    } catch (error) {
        res.status(400).json({ message: "La vérification du paiement a échoué. " + error.message });
    }
});

module.exports = router;