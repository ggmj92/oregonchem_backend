const Quote = require('../../models/QI/Quote');
const Product = require('../../models/QI/Product');
const generatePDF = require('../../services/pdfService');
const { sendQuoteEmail } = require('../../services/emailService');

// Create a new quote
exports.createQuote = async (req, res) => {
    try {
        // Extract and validate data
        const {
            clientType,
            firstName,
            lastName,
            dni,
            phone,
            email,
            companyName,
            ruc,
            products,
            contactPreferences,
            observations,
            comments
        } = req.body;

        const finalObservations = (observations ?? comments ?? '').toString();

        // Enrich products with full product names
        const enrichedProducts = await Promise.all(
            products.map(async (product) => {
                try {
                    const productDoc = await Product.findById(product.productId).lean();
                    return {
                        productId: product.productId,
                        productName: productDoc ? (productDoc.title || productDoc.name) : 'Producto desconocido',
                        presentationId: product.presentationId || null,
                        presentationLabel: product.presentationLabel || 'N/A',
                        quantity: parseInt(product.quantity),
                        frequency: product.frequency
                    };
                } catch (err) {
                    console.error('Error fetching product:', err);
                    return {
                        productId: product.productId,
                        productName: 'Producto desconocido',
                        presentationId: product.presentationId || null,
                        presentationLabel: product.presentationLabel || 'N/A',
                        quantity: parseInt(product.quantity),
                        frequency: product.frequency
                    };
                }
            })
        );

        const quoteData = {
            clientType,
            firstName,
            lastName,
            dni,
            phone,
            email,
            companyName: companyName || null,
            ruc: ruc || null,
            products: enrichedProducts,
            contactPreferences: {
                email: contactPreferences?.email || false,
                whatsapp: contactPreferences?.whatsapp || false,
                phone: contactPreferences?.phone || false
            },
            observations: finalObservations || '',
            status: 'pending',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        };

        const quote = new Quote(quoteData);
        await quote.save();

        // Generate PDF
        let pdfBuffer;
        try {
            pdfBuffer = await generatePDF(quote);
        } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            // Continue without PDF if generation fails
        }

        // Send emails
        try {
            if (pdfBuffer) {
                await sendQuoteEmail(quote, pdfBuffer);
            }
        } catch (emailError) {
            console.error('Error sending emails:', emailError);
            // Continue even if email fails - quote is saved
        }

        res.status(201).json({
            success: true,
            data: {
                id: quote._id,
                status: quote.status,
                createdAt: quote.createdAt
            },
            message: 'Cotización creada exitosamente. Recibirá un correo de confirmación pronto.'
        });
    } catch (error) {
        console.error('Error creating quote:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al crear la cotización'
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
