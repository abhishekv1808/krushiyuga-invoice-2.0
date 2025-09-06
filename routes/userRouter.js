const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');

// Home page
userRouter.get('/', userController.getHome);

// Invoice access flow routes
userRouter.post('/request-invoice-access', userController.requestInvoiceAccess);
userRouter.post('/verify-otp', userController.verifyOTP);
userRouter.get('/my-invoices', userController.getUserInvoicesPage);
userRouter.get('/api/user-invoices', userController.getUserInvoices);
userRouter.get('/api/invoice-details', userController.getInvoiceDetails);

// PDF download route
userRouter.get('/download-pdf/:invoiceId', userController.downloadInvoicePDF);

module.exports = userRouter;