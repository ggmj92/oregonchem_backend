const express = require('express');
const router = express.Router();
const QuoteController = require('../controllers/QI/QuoteController');

// Create a new quote
router.post('/', QuoteController.createQuote);

// Get quotes with filtering
router.get('/', QuoteController.getQuotes);

// Get a specific quote
router.get('/:id', QuoteController.getQuote);

// Update quote status
router.patch('/:id/status', QuoteController.updateQuoteStatus);

module.exports = router; 