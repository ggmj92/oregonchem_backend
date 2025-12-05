// Simple test script for QI API endpoints
// Run with: node test-qi-api.js

const BASE_URL = 'http://localhost:5001/api/qi';

async function testEndpoint(name, url, options = {}) {
    try {
        console.log(`\n🧪 Testing: ${name}`);
        console.log(`   URL: ${url}`);

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
            console.log(`   ✅ Success (${response.status})`);
            if (data.data) {
                if (Array.isArray(data.data)) {
                    console.log(`   📦 Returned ${data.data.length} items`);
                    if (data.pagination) {
                        console.log(`   📄 Page ${data.pagination.page} of ${data.pagination.pages} (${data.pagination.total} total)`);
                    }
                } else {
                    console.log(`   📦 Returned 1 item`);
                }
            }
            return data;
        } else {
            console.log(`   ❌ Failed (${response.status})`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
        return null;
    }
}

async function runTests() {
    console.log('🚀 QI API Endpoint Tests\n');
    console.log('='.repeat(50));

    // Test Products
    console.log('\n📦 PRODUCT ENDPOINTS');
    console.log('-'.repeat(50));

    const products = await testEndpoint(
        'Get all products (first page)',
        `${BASE_URL}/products?page=1&limit=5`
    );

    if (products && products.data && products.data.length > 0) {
        const firstProduct = products.data[0];

        await testEndpoint(
            'Get product by ID',
            `${BASE_URL}/products/${firstProduct._id}`
        );

        if (firstProduct.slug) {
            await testEndpoint(
                'Get product by slug',
                `${BASE_URL}/products/slug/${firstProduct.slug}`
            );
        }

        await testEndpoint(
            'Get related products',
            `${BASE_URL}/products/${firstProduct._id}/related?limit=3`
        );
    }

    await testEndpoint(
        'Get featured products',
        `${BASE_URL}/products/featured?limit=3`
    );

    await testEndpoint(
        'Search products',
        `${BASE_URL}/products?search=acido&limit=5`
    );

    // Test Categories
    console.log('\n📁 CATEGORY ENDPOINTS');
    console.log('-'.repeat(50));

    const categories = await testEndpoint(
        'Get all categories',
        `${BASE_URL}/categories?includeProductCount=true`
    );

    if (categories && categories.data && categories.data.length > 0) {
        const firstCategory = categories.data[0];

        await testEndpoint(
            'Get category by ID',
            `${BASE_URL}/categories/${firstCategory._id}`
        );

        if (firstCategory.slug) {
            await testEndpoint(
                'Get category by slug',
                `${BASE_URL}/categories/slug/${firstCategory.slug}`
            );

            await testEndpoint(
                'Get products in category',
                `${BASE_URL}/categories/${firstCategory._id}/products?page=1&limit=5`
            );
        }
    }

    // Test Presentations
    console.log('\n🏷️  PRESENTATION ENDPOINTS');
    console.log('-'.repeat(50));

    const presentations = await testEndpoint(
        'Get all presentations',
        `${BASE_URL}/presentations`
    );

    if (presentations && presentations.data && presentations.data.length > 0) {
        const firstPresentation = presentations.data[0];

        await testEndpoint(
            'Get presentation by ID',
            `${BASE_URL}/presentations/${firstPresentation._id}`
        );

        await testEndpoint(
            'Get products with presentation',
            `${BASE_URL}/presentations/${firstPresentation._id}/products?page=1&limit=5`
        );
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Tests complete!\n');
}

// Run tests
runTests().catch(console.error);
