const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const AiImageController = require('../controllers/QI/AiImageController');

router.post('/generate', AiImageController.generate);
router.post('/generate-single', AiImageController.generateSingle);
router.get('/test', authMiddleware, AiImageController.test);

module.exports = router;
