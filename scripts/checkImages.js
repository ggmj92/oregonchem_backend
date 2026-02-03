const mongoose = require('mongoose');
require('dotenv').config();

const qiConnection = require('../src/config/qiDatabase');
const Category = require('../src/models/QI/Category');
const Presentation = require('../src/models/QI/CanonicalPresentation');

async function checkImages() {
    try {
        console.log('Checking for images in database...\n');

        // Check categories
        const categories = await Category.find({}).lean();
        const categoriesWithImages = categories.filter(c => c.image?.url);
        console.log(`Categories: ${categories.length} total, ${categoriesWithImages.length} with images`);
        if (categoriesWithImages.length > 0) {
            console.log('Sample category with image:', categoriesWithImages[0].name, categoriesWithImages[0].image.url);
        }

        // Check presentations
        const presentations = await Presentation.find({}).lean();
        const presentationsWithImages = presentations.filter(p => p.image?.url);
        console.log(`\nPresentations: ${presentations.length} total, ${presentationsWithImages.length} with images`);
        if (presentationsWithImages.length > 0) {
            console.log('Sample presentation with image:', presentationsWithImages[0].pretty, presentationsWithImages[0].image.url);
        }

        console.log('\n--- Summary ---');
        if (categoriesWithImages.length === 0 && presentationsWithImages.length === 0) {
            console.log('❌ No images found in database. You need to add images through the dashboard editors.');
        } else {
            console.log('✅ Some images found. Check if they are loading correctly in the dashboard.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkImages();
