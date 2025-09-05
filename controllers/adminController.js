const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

exports.getAdminPortal = (req, res, next) => {
    const loginSuccessMessage = req.session.loginSuccessMessage;
    const errorMessage = req.session.errorMessage;
    const successMessage = req.session.successMessage;
    
    // Clear messages after displaying
    req.session.loginSuccessMessage = null;
    req.session.errorMessage = null;
    req.session.successMessage = null;
    
    res.render('../views/admin/admin-portal.ejs', {
        pageTitle: "Admin Portal | krushiyuga",
        adminEmail: req.session.adminEmail,
        loginSuccessMessage,
        errorMessage,
        successMessage
    });
};

exports.getCreateInvoice = async (req, res, next) => {
    try {
        // Fetch active products for the dropdown
        const products = await Product.find({ isActive: true }).sort({ name: 1 });
        
        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;
        req.session.errorMessage = null;
        req.session.successMessage = null;
        
        res.render('../views/admin/create-invoice.ejs', {
            pageTitle: "Create Invoice | krushiyuga",
            adminEmail: req.session.adminEmail,
            products,
            errorMessage,
            successMessage
        });
    } catch (error) {
        console.error('Error loading create invoice page:', error);
        req.session.errorMessage = 'Error loading create invoice page.';
        res.redirect('/admin-portal');
    }
};

// Products CRUD Operations

// Get all products
exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const sortBy = req.query.sortBy || 'name';
        const sortOrder = req.query.sortOrder || 'asc';

        const skip = (page - 1) * limit;

        // Build query
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            query.category = category;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Get categories for filter dropdown
        const categories = await Product.distinct('category');

        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;
        // Note: We don't clear loginSuccessMessage here - it's only for admin portal
        req.session.errorMessage = null;
        req.session.successMessage = null;

        res.render('../views/admin/products.ejs', {
            pageTitle: "Manage Products | krushiyuga",
            adminEmail: req.session.adminEmail,
            products,
            categories,
            currentPage: page,
            totalPages,
            totalProducts,
            search,
            category,
            sortBy,
            sortOrder,
            errorMessage,
            successMessage
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        req.session.errorMessage = 'Error fetching products.';
        res.redirect('/admin-portal');
    }
};

// Get add product form
exports.getAddProduct = (req, res, next) => {
    const errorMessage = req.session.errorMessage;
    const successMessage = req.session.successMessage;
    req.session.errorMessage = null;
    req.session.successMessage = null;

    res.render('../views/admin/add-product.ejs', {
        pageTitle: "Add Product | krushiyuga",
        adminEmail: req.session.adminEmail,
        errorMessage,
        successMessage,
        product: {} // Empty product for form
    });
};

// Create new product
exports.postAddProduct = async (req, res, next) => {
    try {
        const {
            name, category, description, price, unit, quantityInStock,
            minimumStockLevel, supplierName, supplierContact, supplierEmail,
            sku, hsn, gst
        } = req.body;

        // Validation
        if (!name || !category || !description || !price || !unit || !supplierName || !supplierContact || !hsn) {
            req.session.errorMessage = 'Please fill in all required fields.';
            return res.redirect('/products/add');
        }

        // Check if SKU already exists
        if (sku) {
            const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
            if (existingProduct) {
                req.session.errorMessage = 'Product with this SKU already exists.';
                return res.redirect('/products/add');
            }
        }

        const product = new Product({
            name,
            category,
            description,
            price: parseFloat(price),
            unit,
            quantityInStock: parseInt(quantityInStock) || 0,
            minimumStockLevel: parseInt(minimumStockLevel) || 10,
            supplier: {
                name: supplierName,
                contact: supplierContact,
                email: supplierEmail
            },
            sku: sku ? sku.toUpperCase() : undefined,
            hsn,
            gst: parseFloat(gst) || 18
        });

        await product.save();
        req.session.successMessage = 'Product added successfully!';
        res.redirect('/products');

    } catch (error) {
        console.error('Error adding product:', error);
        if (error.code === 11000) {
            req.session.errorMessage = 'Product with this SKU already exists.';
        } else {
            req.session.errorMessage = 'Error adding product. Please try again.';
        }
        res.redirect('/products/add');
    }
};

// Get edit product form
exports.getEditProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            req.session.errorMessage = 'Product not found.';
            return res.redirect('/products');
        }

        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;
        req.session.errorMessage = null;
        req.session.successMessage = null;

        res.render('../views/admin/edit-product.ejs', {
            pageTitle: "Edit Product | krushiyuga",
            adminEmail: req.session.adminEmail,
            product,
            errorMessage,
            successMessage
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        req.session.errorMessage = 'Error fetching product.';
        res.redirect('/products');
    }
};

// Update product
exports.postEditProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const {
            name, category, description, price, unit, quantityInStock,
            minimumStockLevel, supplierName, supplierContact, supplierEmail,
            sku, hsn, gst, isActive
        } = req.body;

        // Validation
        if (!name || !category || !description || !price || !unit || !supplierName || !supplierContact || !hsn) {
            req.session.errorMessage = 'Please fill in all required fields.';
            return res.redirect(`/products/edit/${productId}`);
        }

        // Check if SKU already exists for other products
        if (sku) {
            const existingProduct = await Product.findOne({ 
                sku: sku.toUpperCase(),
                _id: { $ne: productId }
            });
            if (existingProduct) {
                req.session.errorMessage = 'Product with this SKU already exists.';
                return res.redirect(`/products/edit/${productId}`);
            }
        }

        const updateData = {
            name,
            category,
            description,
            price: parseFloat(price),
            unit,
            quantityInStock: parseInt(quantityInStock) || 0,
            minimumStockLevel: parseInt(minimumStockLevel) || 10,
            supplier: {
                name: supplierName,
                contact: supplierContact,
                email: supplierEmail
            },
            hsn,
            gst: parseFloat(gst) || 18,
            isActive: isActive === 'on'
        };

        if (sku) {
            updateData.sku = sku.toUpperCase();
        }

        await Product.findByIdAndUpdate(productId, updateData);
        req.session.successMessage = 'Product updated successfully!';
        res.redirect('/products');

    } catch (error) {
        console.error('Error updating product:', error);
        req.session.errorMessage = 'Error updating product. Please try again.';
        res.redirect(`/products/edit/${req.params.id}`);
    }
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            req.session.errorMessage = 'Product not found.';
            return res.redirect('/products');
        }

        await Product.findByIdAndDelete(productId);
        req.session.successMessage = 'Product deleted successfully!';
        res.redirect('/products');

    } catch (error) {
        console.error('Error deleting product:', error);
        req.session.errorMessage = 'Error deleting product. Please try again.';
        res.redirect('/products');
    }
};

// Get product details
exports.getProductDetails = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            req.session.errorMessage = 'Product not found.';
            return res.redirect('/products');
        }

        res.render('../views/admin/product-details.ejs', {
            pageTitle: `${product.name} | krushiyuga`,
            adminEmail: req.session.adminEmail,
            product
        });

    } catch (error) {
        console.error('Error fetching product details:', error);
        req.session.errorMessage = 'Error fetching product details.';
        res.redirect('/products');
    }
};

// API endpoint to get product details
exports.getProductById = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            unit: product.unit,
            gst: product.gst,
            quantityInStock: product.quantityInStock
        });
        
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Error fetching product' });
    }
};

