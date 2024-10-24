const Product = require("../models/Product");

const ProductController = {
    // GET ALL PRODUCTS
    async getAllProducts(req, res) {
        try {
            const { site } = req.query;
            const products = await Product.find()
                .populate("presentations categories")
                .exec();
            console.log('Products fetched:', products);
            const filteredProducts = products.map((product) => {
                let siteSpecificData = {
                    descriptions: product.descriptions[site],
                    uses: product.uses[site],
                    images: product.images[site]
                };
                return {
                    name: product.name,
                    presentations: product.presentations,
                    categories: product.categories,
                    descriptions: siteSpecificData.descriptions,
                    uses: siteSpecificData.uses,
                    images: siteSpecificData.images
                };
            });
            res.status(200).json(filteredProducts);
        } catch (error) {
            res.status(500).json({ message: "Error fetching products", error });
        }
    },

    // ADD A PRODUCT
    async createProduct(req, res) {
        try {
            const { name, presentations, categories, descriptions, uses } = req.body;
            const images = {};
            ["site1", "site2", "site3", "site4", "site5"].forEach((site, index) => {
                const imageFile = req.files ? req.files[`site${index + 1}`] : null;
                if (imageFile && imageFile.length > 0) {
                    images[site] = imageFile[0].downloadURL;
                } else {
                    images[site] = "";
                }
            });

            const newProduct = new Product({
                name,
                presentations,
                categories,
                descriptions,
                uses,
                images
            });

            const savedProduct = await newProduct.save();
            res.status(201).json(savedProduct);
        } catch (error) {
            console.error("Error creating product:", error);
            res.status(500).json({ message: "Error creating product", error });
        }
    },

    getProductByIdAndSite: async (req, res) => {
        const { id, site } = req.params;
        try {
            const product = await Product.findById(id)
                .populate("presentations categories")
                .exec();
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            const siteData = {
                descriptions: product.descriptions[site],
                uses: product.uses[site],
                images: product.images[site]
            };
            if (!siteData.descriptions && !siteData.uses && !siteData.images) {
                return res
                    .status(404)
                    .json({ message: "No data for the requested site" });
            }
            const response = {
                name: product.name,
                presentations: product.presentations,
                categories: product.categories,
                descriptions: siteData.descriptions,
                uses: siteData.uses,
                images: siteData.images,
            };
            res.status(200).json(response);
        } catch (error) {
            console.error("Error fetching product:", error);
            res.status(500).json({ message: "Error fetching product", error });
        }
    },

    // SEARCH PRODUCTS BY NAME
    async searchProducts(req, res) {
        try {
            const searchTerm = req.query.searchTerm;
            const products = await Product.find({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
            }).populate('categories');
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: 'Error searching products', error });
        }
    }
};

module.exports = ProductController;

