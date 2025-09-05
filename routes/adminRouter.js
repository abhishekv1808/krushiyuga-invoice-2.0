const express = require('express');
const adminRouter = express.Router();
const {
    getAdminPortal, 
    getCreateInvoice,
    getProducts,
    getAddProduct,
    postAddProduct,
    getEditProduct,
    postEditProduct,
    deleteProduct,
    getProductDetails,
    getAllProductsAPI,
    getProductById,
    createInvoice,
    generateInvoicePDF
} = require('../controllers/adminController');
const {requireAdminAuth} = require('../controllers/authController');

// Admin portal routes
adminRouter.get('/admin-portal', requireAdminAuth, getAdminPortal);
adminRouter.get('/create-invoice', requireAdminAuth, getCreateInvoice);

// Product management routes
adminRouter.get('/products', requireAdminAuth, getProducts);
adminRouter.get('/products/add', requireAdminAuth, getAddProduct);
adminRouter.post('/products/add', requireAdminAuth, postAddProduct);
adminRouter.get('/products/edit/:id', requireAdminAuth, getEditProduct);
adminRouter.post('/products/edit/:id', requireAdminAuth, postEditProduct);
adminRouter.post('/products/delete/:id', requireAdminAuth, deleteProduct);
adminRouter.get('/products/details/:id', requireAdminAuth, getProductDetails);

// API routes
adminRouter.get('/api/products', requireAdminAuth, getAllProductsAPI);
adminRouter.get('/api/products/:id', requireAdminAuth, getProductById);

// Invoice routes
adminRouter.post('/create-invoice', requireAdminAuth, createInvoice);
adminRouter.get('/generate-pdf/:invoiceId', requireAdminAuth, generateInvoicePDF);

module.exports = adminRouter;
