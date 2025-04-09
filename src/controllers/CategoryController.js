const Category = require("../models/Category");

const CategoryController = {
    // GET ALL CATEGORIES
    async getAllCategories(req, res) {
        try {
            const categories = await Category.find().select('name images');
            console.log('Found categories:', categories.length); // Debug log
            res.status(200).json({ data: categories });
        } catch (error) {
            console.error('Error in getAllCategories:', error); // Debug log
            res.status(500).json({ 
                message: "Error fetching categories", 
                error: error.message 
            });
        }
    },

    // ADD A CATEGORY
    async addCategory(req, res) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ 
                    message: "Category name is required" 
                });
            }

            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ 
                    message: "Category already exists" 
                });
            }

            const images = {};
            for (let i = 1; i <= 5; i++) {
                const imageFile = req.files[`images[site${i}]`];
                if (imageFile && imageFile[0]) {
                    images[`site${i}`] = imageFile[0].downloadURL;
                }
            }

            const category = new Category({ name, images });
            await category.save();
            res.status(201).json({ data: category });
        } catch (error) {
            res.status(500).json({ 
                message: "Error adding category", 
                error: error.message 
            });
        }
    },

    // UPDATE A CATEGORY

    // DELETE A CATEGORY
};

module.exports = CategoryController;