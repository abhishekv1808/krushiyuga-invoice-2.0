const express = require('express');
const adminRouter = express.Router();
const {
    getAdminPortal, 
    getCreateInvoice,
    createInvoice,
    getAllInvoices,
    downloadInvoicePDF,
    viewInvoicePreview,
    deleteInvoice
} = require('../controllers/adminController');
const {requireAdminAuth} = require('../controllers/authController');

// Admin portal routes
adminRouter.get('/admin-portal', requireAdminAuth, getAdminPortal);
adminRouter.get('/portal', requireAdminAuth, getAdminPortal); // Alias for easier navigation
adminRouter.get('/create-invoice', requireAdminAuth, getCreateInvoice);

// Invoice management routes  
adminRouter.post('/create-invoice', requireAdminAuth, createInvoice);
adminRouter.get('/invoices', requireAdminAuth, getAllInvoices);
adminRouter.get('/admin-download-pdf/:invoiceId', requireAdminAuth, downloadInvoicePDF);
adminRouter.get('/view-pdf/:invoiceId', requireAdminAuth, viewInvoicePreview); // Invoice preview (HTML)
adminRouter.delete('/delete-invoice/:invoiceId', requireAdminAuth, deleteInvoice); // Delete invoice

module.exports = adminRouter;
