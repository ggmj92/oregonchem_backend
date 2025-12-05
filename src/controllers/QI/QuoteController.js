const Quote = require('../../models/QI/Quote');

// Create a new quote
exports.createQuote = async (req, res) => {
    try {
        const quoteData = {
            ...req.body,
            status: 'pending',
            createdAt: new Date()
        };

        const quote = new Quote(quoteData);
        await quote.save();

        res.status(201).json({
            success: true,
            data: quote,
            message: 'Cotización creada exitosamente'
        });
    } catch (error) {
        console.error('Error creating quote:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all quotes with filtering
exports.getQuotes = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const quotes = await Quote.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Quote.countDocuments(query);

        res.json({
            success: true,
            data: quotes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get a single quote
exports.getQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id).lean();

        if (!quote) {
            return res.status(404).json({
                success: false,
                error: 'Cotización no encontrada'
            });
        }

        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update quote status
exports.updateQuoteStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido'
            });
        }

        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
        ).lean();

        if (!quote) {
            return res.status(404).json({
                success: false,
                error: 'Cotización no encontrada'
            });
        }

        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        console.error('Error updating quote:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
