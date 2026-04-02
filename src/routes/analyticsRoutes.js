const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/QI/AnalyticsController');

router.get('/combined/overview', AnalyticsController.getCombinedOverview);
router.get('/:siteId/overview', AnalyticsController.getOverview);
router.get('/:siteId/events', AnalyticsController.getEvents);

module.exports = router;
