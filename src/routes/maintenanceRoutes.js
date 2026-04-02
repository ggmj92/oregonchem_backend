const express = require('express');
const router = express.Router();
const MaintenanceController = require('../controllers/QI/MaintenanceController');

router.post('/cleanup-presentations', MaintenanceController.cleanupPresentations);

module.exports = router;
