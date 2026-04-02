const express = require('express');
const router = express.Router();
const { mainApp } = require('../config/firebaseAdminInit');

router.post('/verify', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({
            success: false,
            error: 'ID token is required'
        });
    }

    try {
        const decodedToken = await mainApp.auth().verifyIdToken(idToken);
        res.json({ success: true, data: { uid: decodedToken.uid } });
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;