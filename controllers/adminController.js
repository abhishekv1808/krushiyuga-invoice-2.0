const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const PDFGenerator = require('../utils/pdfGenerator');
const cloudinary = require('../utils/cloudinaryConfig');
const path = require('path');
const fs = require('fs');

// Helper function to convert number to words
function convertNumberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    function convertHundreds(n) {
        let result = '';
        if (n >= 100) {
            result += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 20) {
            result += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        } else if (n >= 10) {
            result += teens[n - 10] + ' ';
            return result;
        }
        if (n > 0) {
            result += ones[n] + ' ';
        }
        return result;
    }

    let result = '';
    let groupIndex = 0;
    
    while (num > 0) {
        if (num % 1000 !== 0) {
            result = convertHundreds(num % 1000) + thousands[groupIndex] + ' ' + result;
        }
        num = Math.floor(num / 1000);
        groupIndex++;
    }
    
    return result.trim();
}

exports.getAdminPortal = async (req, res, next) => {
    const loginSuccessMessage = req.session.loginSuccessMessage;
    const errorMessage = req.session.errorMessage;
    const successMessage = req.session.successMessage;
    
    // Clear messages after displaying
    req.session.loginSuccessMessage = null;
    req.session.errorMessage = null;
    req.session.successMessage = null;

    try {
        // Get recent invoices for dashboard
        const recentInvoices = await Invoice.find()
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Calculate dashboard statistics
        const totalInvoices = await Invoice.countDocuments();
        const totalRevenue = await Invoice.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const monthlyInvoices = await Invoice.countDocuments({
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });

        const dashboardStats = {
            totalInvoices,
            totalRevenue: totalRevenue[0]?.total || 0,
            monthlyInvoices,
            recentInvoices
        };

        res.render('../views/admin/admin-portal.ejs', {
            pageTitle: "Admin Portal | krushiyuga",
            adminEmail: req.session.adminEmail,
            loginSuccessMessage,
            errorMessage,
            successMessage,
            dashboardStats
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.render('../views/admin/admin-portal.ejs', {
            pageTitle: "Admin Portal | krushiyuga",
            adminEmail: req.session.adminEmail,
            loginSuccessMessage,
            errorMessage: 'Error loading dashboard data',
            successMessage,
            dashboardStats: {
                totalInvoices: 0,
                totalRevenue: 0,
                monthlyInvoices: 0,
                recentInvoices: []
            }
        });
    }
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

// API endpoint to get all products for invoice creation
exports.getAllProductsAPI = async (req, res, next) => {
    try {
        const products = await Product.find({ isActive: true })
            .select('_id name description hsn unit price gst quantityInStock')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            products: products
        });
        
    } catch (error) {
        console.error('Error fetching products for API:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error fetching products' 
        });
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

// Create Invoice
exports.createInvoice = async (req, res, next) => {
    try {
        console.log('=== CREATE INVOICE DEBUG INFO ===');
        console.log('Request headers:', req.headers);
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        console.log('Request body (raw):', req.body);
        console.log('Request body type:', typeof req.body);
        console.log('Request body keys:', Object.keys(req.body || {}));
        console.log('================================');
        
        const {
            clientName,
            clientEmail,
            clientPhone,
            billingAddress,
            shippingAddress,
            placeOfSupply,
            items,
            notes
        } = req.body;

        console.log('Extracted data:', { clientName, clientEmail, billingAddress, items }); // Debug log

        // Validate required fields
        if (!clientName || !clientEmail || !billingAddress || !items || items.length === 0) {
            console.log('Validation failed:', { 
                clientName: !!clientName, 
                clientEmail: !!clientEmail, 
                billingAddress: !!billingAddress, 
                items: items ? items.length : 'undefined' 
            }); // Debug log
            
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill all required fields and add at least one item' 
            });
        }

        // Process items and calculate totals
        const processedItems = [];

        for (let item of items) {
            console.log('Processing item:', item); // Debug log
            
            const product = await Product.findById(item.productId);
            if (!product) {
                console.log('Product not found:', item.productId); // Debug log
                return res.status(400).json({ 
                    success: false, 
                    message: `Product not found: ${item.productId}` 
                });
            }

            const quantity = parseFloat(item.quantity);
            const rate = parseFloat(item.rate);
            const gstRate = parseFloat(item.gstRate);

            // Calculate GST-inclusive amounts
            const totalAmount = quantity * rate;
            const taxableAmount = totalAmount / (1 + gstRate / 100);
            const gstAmount = totalAmount - taxableAmount;

            processedItems.push({
                product: product._id,
                productName: product.name,
                description: product.description || '',
                quantity: quantity,
                unit: product.unit,
                rate: rate,
                amount: Math.round(totalAmount * 100) / 100,
                gst: gstRate,
                gstAmount: Math.round(gstAmount * 100) / 100
            });
        }

        console.log('Processed items:', processedItems); // Debug log

        // Create invoice with proper structure matching the model
        const invoice = new Invoice({
            to: {
                companyName: clientName,
                contactPerson: clientName,
                email: clientEmail,
                phone: clientPhone || '',
                address: billingAddress,
                gstin: '' // Optional client GSTIN
            },
            items: processedItems,
            discount: 0, // No discount for now
            notes: notes || 'Thank you for the Business',
            createdBy: req.session.adminId
        });

        console.log('About to save invoice:', invoice); // Debug log
        await invoice.save();
        console.log('Invoice saved successfully:', invoice._id); // Debug log

        res.json({
            success: true,
            message: 'Invoice created successfully',
            invoice: {
                _id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                totalAmount: invoice.totalAmount
            }
        });

    } catch (error) {
        console.error('Error creating invoice:', error);
        console.error('Error stack:', error.stack); // More detailed error log
        res.status(500).json({ 
            success: false, 
            message: 'Error creating invoice. Please try again.' 
        });
    }
};

// Generate PDF for Invoice
exports.generateInvoicePDF = async (req, res, next) => {
    try {
        console.log('PDF generation request for invoice ID:', req.params.invoiceId);
        
        const invoiceId = req.params.invoiceId;
        const invoice = await Invoice.findById(invoiceId).populate('items.product');

        if (!invoice) {
            console.log('Invoice not found:', invoiceId);
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }

        console.log('Invoice found:', invoice.invoiceNumber);

        // Create invoices directory if it doesn't exist
        const invoicesDir = path.join(process.cwd(), 'public', 'invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
            console.log('Created invoices directory');
        }

        const filename = `${invoice.invoiceNumber}.pdf`;
        const outputPath = path.join(invoicesDir, filename);

        console.log('Generating PDF at:', outputPath);

        // Generate PDF
        await PDFGenerator.generateInvoicePDF(invoice, outputPath);
        console.log('PDF generated successfully');

        // Upload to Cloudinary with public access
        console.log('Uploading PDF to Cloudinary...');
        const cloudinaryResponse = await cloudinary.uploader.upload(outputPath, {
            resource_type: 'raw',
            folder: 'krushiyuga-invoices',
            public_id: invoice.invoiceNumber,
            use_filename: true,
            unique_filename: false,
            access_mode: 'public',
            type: 'upload'
        });

        console.log('PDF uploaded to Cloudinary:', cloudinaryResponse.secure_url);

        // Update invoice with Cloudinary URL
        await Invoice.findByIdAndUpdate(invoiceId, {
            pdfUrl: cloudinaryResponse.secure_url,
            localPdfPath: outputPath
        });

        console.log('Invoice updated with PDF URLs');

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Send PDF file
        const fileStream = fs.createReadStream(outputPath);
        fileStream.pipe(res);

        // Clean up local file after sending (optional - keep for backup)
        fileStream.on('end', () => {
            console.log('PDF sent to client successfully');
            // Optionally delete the local file after sending
            // fs.unlinkSync(outputPath);
        });

        fileStream.on('error', (streamError) => {
            console.error('Error streaming PDF:', streamError);
            res.status(500).json({ 
                success: false, 
                message: 'Error streaming PDF file' 
            });
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating PDF. Please try again.' 
        });
    }
};

// Get all invoices for CRM view
exports.getAllInvoices = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get invoices with pagination
        const invoices = await Invoice.find()
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalInvoices = await Invoice.countDocuments();
        const totalPages = Math.ceil(totalInvoices / limit);

        res.render('../views/admin/invoices.ejs', {
            pageTitle: "All Invoices | krushiyuga",
            adminEmail: req.session.adminEmail,
            invoices,
            currentPage: page,
            totalPages,
            totalInvoices,
            errorMessage: req.session.errorMessage,
            successMessage: req.session.successMessage
        });

        // Clear messages
        req.session.errorMessage = null;
        req.session.successMessage = null;

    } catch (error) {
        console.error('Error fetching invoices:', error);
        req.session.errorMessage = 'Error loading invoices';
        res.redirect('/admin-portal');
    }
};

// Download invoice PDF from Cloudinary
exports.downloadInvoicePDF = async (req, res, next) => {
    try {
        const invoiceId = req.params.invoiceId;
        console.log('🔥 Admin PDF Download Request for invoice ID:', invoiceId);
        
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            console.log('❌ Invoice not found:', invoiceId);
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }

        console.log('✅ Invoice found:', invoice.invoiceNumber);

        // Try to serve local file first
        if (invoice.localPdfPath && fs.existsSync(invoice.localPdfPath)) {
            console.log('📄 Serving PDF from local file:', invoice.localPdfPath);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
            
            // Stream the file
            const fileStream = fs.createReadStream(invoice.localPdfPath);
            fileStream.pipe(res);
            return;
        }

        // Fallback to Cloudinary URL if local file doesn't exist
        if (invoice.pdfUrl) {
            console.log('🔗 Redirecting to Cloudinary URL:', invoice.pdfUrl);
            return res.redirect(invoice.pdfUrl);
        }

        // If no PDF exists, generate one on-the-fly using the same logic as user PDF
        console.log('🔧 Generating PDF on-the-fly...');
        
        const PDFDocument = require('pdfkit');
        const QRCode = require('qrcode');

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);

        // Exact colors from admin invoice
        const blackColor = '#000000';
        const grayColor = '#555555';
        const lightGrayColor = '#999999';
        const greenColor = '#22c55e';
        const borderColor = '#cccccc';

        let yPos = 50;

        // Header - TAX INVOICE and ORIGINAL FOR RECIPIENT (exact positioning)
        doc.fontSize(20).fillColor(blackColor).text('TAX INVOICE', 50, yPos);
        doc.fontSize(10).fillColor(lightGrayColor).text('ORIGINAL FOR RECIPIENT', 400, yPos);
        
        // Krushiyuga brand (exact position and color)
        doc.fontSize(22).fillColor(greenColor).text('Krushiyuga', 450, yPos + 25);

        yPos += 70;

        // Company details section (exact layout)
        doc.fontSize(14).fillColor(blackColor).text('Krushiyuga', 50, yPos);
        yPos += 16;
        doc.fontSize(9).fillColor(grayColor).text('GSTIN: ZZAAAAA00001ZZ5', 50, yPos);
        yPos += 12;
        doc.fontSize(9).fillColor(grayColor).text('Agriculture Solutions & Services', 50, yPos);
        yPos += 12;
        doc.fontSize(9).fillColor(grayColor).text('No. 39 & 1470, DRLS Plaza Union Bank Building', 50, yPos);
        yPos += 10;
        doc.fontSize(9).fillColor(grayColor).text('Tumkur Road, Vidya Nagar, T. Dasarahalli, Bengaluru 560057', 50, yPos);
        yPos += 12;
        doc.fontSize(9).fillColor(grayColor).text('Mobile: 9876543210 Email: info@krushiyuga.com', 50, yPos);

        yPos += 30;

        // Invoice details (exact spacing)
        doc.fontSize(11).fillColor(blackColor).text(`Invoice #: ${invoice.invoiceNumber}`, 50, yPos);
        doc.fontSize(11).fillColor(blackColor).text(`Invoice Date: ${new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 350, yPos);

        yPos += 25;

        // Customer details section (exact three column layout)
        doc.fontSize(11).fillColor(blackColor).text('Customer Details:', 50, yPos);
        doc.fontSize(11).fillColor(blackColor).text('Billing address:', 200, yPos);
        doc.fontSize(11).fillColor(blackColor).text('Shipping address:', 380, yPos);

        yPos += 16;
        doc.fontSize(9).fillColor(grayColor).text(invoice.to.companyName || 'Customer Name', 50, yPos);
        doc.fontSize(9).fillColor(grayColor).text(invoice.to.address || 'Billing Address', 200, yPos);
        doc.fontSize(9).fillColor(grayColor).text(invoice.to.address || 'Shipping Address', 380, yPos);

        yPos += 11;
        doc.fontSize(9).fillColor(grayColor).text(invoice.to.email || 'email@example.com', 50, yPos);

        yPos += 11;
        doc.fontSize(9).fillColor(grayColor).text(invoice.to.phone || '1234567890', 50, yPos);

        yPos += 20;

        // Place of Supply
        doc.fontSize(11).fillColor(blackColor).text('Place of Supply: KARNATAKA', 50, yPos);

        yPos += 30;

        // Items table (exact structure)
        const tableTop = yPos;
        const rowHeight = 35;
        
        // Table header with exact gray background
        doc.rect(50, yPos, 500, 25).fillColor('#f0f0f0').fill();
        doc.rect(50, yPos, 500, 25).strokeColor(borderColor).lineWidth(0.5).stroke();

        // Table headers (exact positioning)
        doc.fontSize(10).fillColor(blackColor);
        doc.text('#', 55, yPos + 8, { width: 20 });
        doc.text('Item', 85, yPos + 8, { width: 180 });
        doc.text('Rate/Item', 275, yPos + 8, { width: 60 });
        doc.text('Qty', 345, yPos + 8, { width: 30 });
        doc.text('Taxable Value', 385, yPos + 8, { width: 80 });
        doc.text('Tax Amount', 475, yPos + 8, { width: 50 });
        doc.text('Amount', 525, yPos + 8, { width: 40 });

        // Vertical lines for header
        doc.moveTo(80, yPos).lineTo(80, yPos + 25).stroke();
        doc.moveTo(270, yPos).lineTo(270, yPos + 25).stroke();
        doc.moveTo(340, yPos).lineTo(340, yPos + 25).stroke();
        doc.moveTo(380, yPos).lineTo(380, yPos + 25).stroke();
        doc.moveTo(470, yPos).lineTo(470, yPos + 25).stroke();
        doc.moveTo(520, yPos).lineTo(520, yPos + 25).stroke();

        yPos += 25;

        // Table rows (exact data structure)
        invoice.items.forEach((item, index) => {
            // Row border
            doc.rect(50, yPos, 500, rowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();

            // Row data
            doc.fontSize(10).fillColor(blackColor);
            doc.text((index + 1).toString(), 55, yPos + 8, { width: 20 });
            
            // Item name and description
            doc.fontSize(10).fillColor(blackColor).text(item.productName || 'Product', 85, yPos + 5, { width: 180 });
            doc.fontSize(8).fillColor(grayColor).text(item.description || 'Product description', 85, yPos + 18, { width: 180 });
            
            doc.fontSize(10).fillColor(blackColor).text((item.rate || 0).toFixed(2), 275, yPos + 8, { width: 60 });
            doc.text(`${item.quantity || 1} ${item.unit || 'unit'}`, 345, yPos + 8, { width: 30 });
            
            const taxableValue = (item.amount || 0) - (item.gstAmount || 0);
            doc.text(taxableValue.toFixed(2), 385, yPos + 8, { width: 80 });
            doc.text(`${(item.gstAmount || 0).toFixed(2)} (${item.gst || 0}%)`, 475, yPos + 8, { width: 50 });
            doc.text((item.amount || 0).toFixed(2), 525, yPos + 8, { width: 40 });

            // Vertical lines for row
            doc.moveTo(80, yPos).lineTo(80, yPos + rowHeight).stroke();
            doc.moveTo(270, yPos).lineTo(270, yPos + rowHeight).stroke();
            doc.moveTo(340, yPos).lineTo(340, yPos + rowHeight).stroke();
            doc.moveTo(380, yPos).lineTo(380, yPos + rowHeight).stroke();
            doc.moveTo(470, yPos).lineTo(470, yPos + rowHeight).stroke();
            doc.moveTo(520, yPos).lineTo(520, yPos + rowHeight).stroke();

            yPos += rowHeight;
        });

        yPos += 20;

        // Summary section (exact layout)
        const totalAmount = invoice.totalAmount || 0;
        
        // Left side - totals
        doc.fontSize(11).fillColor(blackColor).text(`Total Items / Qty: ${invoice.items.length} / ${invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}`, 50, yPos);
        yPos += 15;
        
        // Amount in words (exact format)
        doc.fontSize(11).fillColor(blackColor).text(`Total amount (in words): ${convertNumberToWords(totalAmount)} Only`, 50, yPos, { width: 350 });

        // Right side summary with improved spacing and formatting
        let summaryY = yPos - 15;
        
        // Create a neat summary table
        const summaryX = 380;
        const summaryWidth = 150;
        const summaryRowHeight = 18;
        
        // Taxable Amount
        doc.fontSize(11).fillColor(blackColor).text('Taxable Amount', summaryX, summaryY);
        doc.fontSize(11).fillColor(blackColor).text(`₹ ${(invoice.subtotal || 0).toFixed(2)}`, summaryX + 90, summaryY, { align: 'right', width: 60 });
        
        summaryY += summaryRowHeight;
        
        // IGST
        doc.fontSize(11).fillColor(blackColor).text('IGST', summaryX, summaryY);
        doc.fontSize(11).fillColor(blackColor).text(`₹ ${(invoice.totalGST || 0).toFixed(2)}`, summaryX + 90, summaryY, { align: 'right', width: 60 });
        
        summaryY += summaryRowHeight;
        
        // Draw a line before total
        doc.moveTo(summaryX, summaryY + 2).lineTo(summaryX + summaryWidth, summaryY + 2).strokeColor('#cccccc').lineWidth(0.5).stroke();
        summaryY += 8;
        
        // Total (highlighted)
        doc.fontSize(12).fillColor(blackColor).text('Total', summaryX, summaryY);
        doc.fontSize(12).fillColor(blackColor).text(`₹ ${totalAmount.toFixed(2)}`, summaryX + 90, summaryY, { align: 'right', width: 60 });
        
        summaryY += summaryRowHeight + 5;
        
        // Amount Payable (final total)
        doc.fontSize(11).fillColor(blackColor).text('Amount Payable:', summaryX, summaryY);
        doc.fontSize(11).fillColor(blackColor).text(`₹ ${totalAmount.toFixed(2)}`, summaryX + 90, summaryY, { align: 'right', width: 60 });

        yPos += 80;

        // Bottom section - exact three column layout
        // Headers
        doc.fontSize(11).fillColor(blackColor).text('Pay using UPI:', 50, yPos);
        doc.fontSize(11).fillColor(blackColor).text('Bank Details:', 220, yPos);
        doc.fontSize(11).fillColor(blackColor).text('For Krushiyuga', 420, yPos);

        yPos += 20;

        // QR Code (exact size and position)
        const qrData = `upi://pay?pa=krushiyuga@paytm&pn=KRUSHIYUGA&am=${totalAmount}&tr=${invoice.invoiceNumber}&cu=INR`;
        try {
            const qrCodeDataURL = await QRCode.toDataURL(qrData, { 
                width: 120,
                margin: 1,
                color: { dark: '#000000', light: '#FFFFFF' }
            });
            const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
            doc.image(qrCodeBuffer, 50, yPos, { width: 100, height: 100 });
        } catch (qrError) {
            console.log('QR Code generation failed:', qrError);
        }

        // Bank details (improved spacing and format)
        let bankY = yPos;
        doc.fontSize(10).fillColor(blackColor).text('Bank:', 220, bankY);
        doc.fontSize(10).fillColor(grayColor).text('BANK OF BARODA', 280, bankY);
        
        bankY += 15;
        doc.fontSize(10).fillColor(blackColor).text('Account No:', 220, bankY);
        doc.fontSize(10).fillColor(grayColor).text('33700200000952', 280, bankY);
        
        bankY += 15;
        doc.fontSize(10).fillColor(blackColor).text('IFSC:', 220, bankY);
        doc.fontSize(10).fillColor(grayColor).text('BARB0PEENYA (Fifth character is Zero)', 280, bankY);
        
        bankY += 15;
        doc.fontSize(10).fillColor(blackColor).text('Branch:', 220, bankY);
        doc.fontSize(10).fillColor(grayColor).text('PEENYA', 280, bankY);

        // Authorized Signatory (exact position)
        doc.fontSize(11).fillColor(blackColor).text('Authorized Signatory', 420, yPos + 70);

        yPos += 120;

        // Notes Section
        doc.fontSize(11).fillColor(blackColor).text('Notes:', 50, yPos);
        yPos += 18;
        const notesText = invoice.notes && invoice.notes.trim() ? invoice.notes : 'Thank you for Business';
        doc.fontSize(10).fillColor(grayColor).text(notesText, 50, yPos, { width: 500 });
        yPos += 25;

        // Terms and Conditions
        doc.fontSize(11).fillColor(blackColor).text('Terms and Conditions:', 50, yPos);
        yPos += 18;
        doc.fontSize(10).fillColor(grayColor).text('1. Payment is due within 30 days from the invoice date.', 50, yPos, { width: 500 });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('❌ Admin PDF Download error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error downloading PDF' 
        });
    }
};

// View Invoice Preview (HTML version)
exports.viewInvoicePreview = async (req, res, next) => {
    try {
        const invoiceId = req.params.invoiceId;
        const invoice = await Invoice.findById(invoiceId).populate('items.product', 'name');

        if (!invoice) {
            req.session.errorMessage = 'Invoice not found';
            return res.redirect('/admin/invoices');
        }

        res.render('../views/admin/invoice-preview.ejs', {
            pageTitle: `Invoice Preview - ${invoice.invoiceNumber} | krushiyuga`,
            adminEmail: req.session.adminEmail,
            invoice,
            errorMessage: req.session.errorMessage,
            successMessage: req.session.successMessage
        });

        // Clear messages
        req.session.errorMessage = null;
        req.session.successMessage = null;

    } catch (error) {
        console.error('Error viewing invoice preview:', error);
        req.session.errorMessage = 'Error loading invoice preview';
        res.redirect('/admin/invoices');
    }
};

// Delete Invoice
exports.deleteInvoice = async (req, res) => {
    try {
        const invoiceId = req.params.invoiceId;
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }

        // Delete PDF file from local storage if exists
        if (invoice.localPdfPath) {
            const fullPath = path.join(__dirname, '..', invoice.localPdfPath);
            try {
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log('Local PDF file deleted:', fullPath);
                }
            } catch (fileError) {
                console.error('Error deleting local PDF file:', fileError);
            }
        }

        // Delete PDF from Cloudinary if exists
        if (invoice.pdfUrl) {
            try {
                // Extract public_id from the Cloudinary URL
                const urlParts = invoice.pdfUrl.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const publicId = fileName.split('.')[0];
                
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                console.log('Cloudinary PDF deleted:', publicId);
            } catch (cloudinaryError) {
                console.error('Error deleting Cloudinary PDF:', cloudinaryError);
            }
        }

        // Delete the invoice from database
        await Invoice.findByIdAndDelete(invoiceId);

        res.json({ 
            success: true, 
            message: `Invoice ${invoice.invoiceNumber} deleted successfully` 
        });

    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting invoice' 
        });
    }
};

