const express = require('express');
const router = express.Router();
const Presentation = require('../models/QI/CanonicalPresentation');
const Product = require('../models/QI/Product');

// Conversion helpers
function convertToKg(qty, unit) {
    const conversions = {
        'kg': 1,
        'g': 0.001,
        'ton': 1000,
        'lb': 0.453592,
        'oz': 0.0283495
    };
    return qty * (conversions[unit] || 1);
}

function convertToLiters(qty, unit) {
    const conversions = {
        'L': 1,
        'ml': 0.001,
        'gal': 3.78541
    };
    return qty * (conversions[unit] || 1);
}

// POST /api/maintenance/cleanup-presentations
router.post('/cleanup-presentations', async (req, res) => {
    try {
        const results = {
            analysis: {},
            deleted: {},
            created: {},
            updated: {}
        };

        // Step 1: Analyze presentations
        const presentations = await Presentation.find({}).lean();
        
        const solidUnits = ['kg', 'g', 'ton', 'lb', 'oz'];
        const liquidUnits = ['L', 'ml', 'gal'];

        const solids = presentations.filter(p => solidUnits.includes(p.unit));
        const liquids = presentations.filter(p => liquidUnits.includes(p.unit));

        // Find presentations to delete
        const solidsToDelete = solids.filter(p => convertToKg(p.qty, p.unit) < 20);
        const liquidsToDelete = liquids.filter(p => {
            const liters = convertToLiters(p.qty, p.unit);
            return liters !== 14 && liters !== 20;
        });

        const allToDelete = [...solidsToDelete, ...liquidsToDelete];
        const idsToDelete = allToDelete.map(p => p._id);

        results.analysis = {
            totalPresentations: presentations.length,
            solidsToDelete: solidsToDelete.length,
            liquidsToDelete: liquidsToDelete.length,
            totalToDelete: allToDelete.length,
            presentationsToDelete: allToDelete.map(p => ({
                id: p._id,
                pretty: p.pretty,
                qty: p.qty,
                unit: p.unit,
                productCount: p.productCount
            }))
        };

        // Step 2: Remove presentations from products
        const affectedProducts = await Product.find({
            presentationIds: { $in: idsToDelete }
        });

        for (const product of affectedProducts) {
            product.presentationIds = product.presentationIds.filter(
                id => !idsToDelete.some(delId => delId.equals(id))
            );
            await product.save();
        }

        results.updated.productsUpdated = affectedProducts.length;

        // Step 3: Delete presentations
        const deleteResult = await Presentation.deleteMany({
            _id: { $in: idsToDelete }
        });

        results.deleted.presentationsDeleted = deleteResult.deletedCount;

        // Step 4: Create Cilindro presentation
        let cilindroId;
        const existingCilindro = await Presentation.findOne({ pretty: 'Cilindro' });
        
        if (existingCilindro) {
            cilindroId = existingCilindro._id;
            results.created.cilindro = 'Already exists';
        } else {
            const cilindro = new Presentation({
                qty: 1,
                unit: 'cilindro',
                pretty: 'Cilindro',
                image: {
                    url: '/images/presentations/Cilindro.png',
                    alt: 'Cilindro industrial'
                },
                sortOrder: 100,
                productCount: 0
            });
            await cilindro.save();
            cilindroId = cilindro._id;
            results.created.cilindro = cilindroId;
        }

        // Step 5: Add Cilindro to all liquid products
        const liquidProducts = await Product.find({
            physicalState: 'liquido'
        });

        let cilindroAddedCount = 0;
        for (const product of liquidProducts) {
            if (!product.presentationIds.some(id => id.equals(cilindroId))) {
                product.presentationIds.push(cilindroId);
                await product.save();
                cilindroAddedCount++;
            }
        }

        // Update Cilindro product count
        await Presentation.findByIdAndUpdate(cilindroId, {
            productCount: liquidProducts.length
        });

        results.updated.cilindroAddedToProducts = cilindroAddedCount;
        results.updated.totalLiquidProducts = liquidProducts.length;

        // Final summary
        const remainingPresentations = await Presentation.find({});
        results.summary = {
            remainingPresentations: remainingPresentations.length,
            presentations: remainingPresentations.map(p => ({
                pretty: p.pretty,
                qty: p.qty,
                unit: p.unit,
                productCount: p.productCount
            }))
        };

        res.json({
            success: true,
            message: 'Presentation cleanup completed successfully',
            results
        });

    } catch (error) {
        console.error('Error in cleanup-presentations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
