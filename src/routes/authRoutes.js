const express = require('express');
const router = express.Router();
const { mainApp } = require('../config/firebaseAdminInit');

router.post('/verify', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({
            message: 'Missing ID token',
            error: 'No ID token provided in request body'
        });
    }

    try {
        const decodedToken = await mainApp.auth().verifyIdToken(idToken);
        res.json({ uid: decodedToken.uid });
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ 
            message: 'Unauthorized',
            error: error.message
        });
    }
});

module.exports = router;