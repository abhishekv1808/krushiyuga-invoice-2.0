const Invoice = require('../models/Invoice');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../utils/emailConfig');

// Initialize global sessions on startup
console.log('🚀 UserController loaded - Initializing session management');
global.invoiceAccessSessions = global.invoiceAccessSessions || {};
console.log(`📊 Sessions at startup: ${Object.keys(global.invoiceAccessSessions).length} active sessions`);

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

exports.getHome = (req, res, next) => {
    res.render('../views/user/home.ejs', {
        pageTitle: "Krushiyuga Invoice Management | Home",
        adminEmail: req.session.adminEmail || null
    });
};

// Step 1: Email verification and OTP sending
exports.requestInvoiceAccess = async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('📧 Invoice access request:', email);
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address' 
            });
        }

        // Check if any invoices exist for this email
        const invoiceCount = await Invoice.countDocuments({ 
            $or: [
                { 'to.email': email.toLowerCase() },
                { 'customerEmail': email.toLowerCase() }
            ]
        });

        console.log(`- Invoices found for ${email}: ${invoiceCount}`);

        if (invoiceCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No invoices found for this email address' 
            });
        }

        // Rate limiting: Check if too many requests from same email in last 15 minutes
        const recentOTPs = await OTP.countDocuments({
            email: email.toLowerCase(),
            createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
        });

        if (recentOTPs >= 3) {
            return res.status(429).json({ 
                success: false, 
                message: 'Too many requests. Please wait 15 minutes before requesting again.' 
            });
        }

        // Invalidate any existing unused OTPs for this email
        await OTP.updateMany(
            { 
                email: email.toLowerCase(), 
                isUsed: false 
            },
            { 
                isUsed: true 
            }
        );

        // Generate new OTP
        const otpCode = generateOTP();
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        // Save OTP to database
        const newOTP = new OTP({
            email: email.toLowerCase(),
            otp: otpCode,
            ipAddress: clientIP,
            userAgent: userAgent
        });

        await newOTP.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otpCode);
        
        if (!emailResult.success) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send verification email. Please try again.' 
            });
        }

        res.json({ 
            success: true, 
            message: `Verification code sent to ${email}. Please check your email.`,
            invoiceCount: invoiceCount 
        });

    } catch (error) {
        console.error('Request invoice access error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error. Please try again later.' 
        });
    }
};

// Step 2: OTP verification
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and OTP are required' 
            });
        }

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            otp: otp,
            isUsed: false
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired OTP' 
            });
        }

        // Check if OTP is still valid
        if (!otpRecord.isValid()) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired or exceeded maximum attempts' 
            });
        }

        // Mark OTP as used
        await otpRecord.markAsUsed();

        // Generate session token (simple approach - in production, use JWT)
        const sessionToken = require('crypto').randomBytes(32).toString('hex');
        
        // Store session in memory (in production, use Redis or database)
        global.invoiceAccessSessions = global.invoiceAccessSessions || {};
        const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        global.invoiceAccessSessions[sessionToken] = {
            email: email.toLowerCase(),
            createdAt: new Date(),
            expiresAt: sessionExpiry
        };

        console.log(`✅ Session created for ${email}`);
        console.log(`📅 Session expires at: ${sessionExpiry.toLocaleString()}`);
        console.log(`🔑 Session token: ${sessionToken.substring(0, 8)}...`);
        console.log(`📊 Total active sessions: ${Object.keys(global.invoiceAccessSessions).length}`);
        
        // Log all active sessions for debugging
        logActiveSessions();

        res.json({ 
            success: true, 
            message: 'OTP verified successfully',
            sessionToken: sessionToken
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error. Please try again later.' 
        });
    }
};

// Helper function to log all active sessions
const logActiveSessions = () => {
    if (global.invoiceAccessSessions) {
        const sessions = Object.entries(global.invoiceAccessSessions);
        console.log(`📊 Active Sessions Report (${sessions.length} total):`);
        sessions.forEach(([token, session]) => {
            const timeLeft = Math.ceil((session.expiresAt - new Date()) / (1000 * 60)); // minutes
            console.log(`  🔑 ${token.substring(0, 8)}... | Email: ${session.email} | Expires in: ${timeLeft}min`);
        });
    } else {
        console.log('📊 No active sessions found');
    }
};

// Helper function to refresh session timeout
const refreshSession = (sessionToken) => {
    if (global.invoiceAccessSessions && global.invoiceAccessSessions[sessionToken]) {
        const oldExpiry = global.invoiceAccessSessions[sessionToken].expiresAt;
        const newExpiry = new Date(Date.now() + 30 * 60 * 1000); // Extend by 30 minutes
        global.invoiceAccessSessions[sessionToken].expiresAt = newExpiry;
        console.log(`🔄 Session refreshed for token: ${sessionToken.substring(0, 8)}...`);
        console.log(`📅 Old expiry: ${oldExpiry.toLocaleString()}`);
        console.log(`📅 New expiry: ${newExpiry.toLocaleString()}`);
        return true;
    } else {
        console.log(`❌ Session not found for refresh: ${sessionToken.substring(0, 8)}...`);
        return false;
    }
};

// Step 3: Get user invoices
exports.getUserInvoices = async (req, res) => {
    try {
        const { sessionToken } = req.query;

        if (!sessionToken) {
            return res.status(401).json({ 
                success: false, 
                message: 'Session token required' 
            });
        }

        console.log(`🔍 getUserInvoices - Session verification for token: ${sessionToken.substring(0, 8)}...`);
        
        // Verify session
        const session = global.invoiceAccessSessions?.[sessionToken];
        const now = new Date();
        
        console.log(`📊 Session found: ${session ? 'Yes' : 'No'}`);
        if (session) {
            console.log(`📅 Session expires at: ${session.expiresAt.toLocaleString()}`);
            console.log(`🕐 Current time: ${now.toLocaleString()}`);
            console.log(`⏰ Time until expiry: ${Math.round((session.expiresAt - now) / 1000 / 60)} minutes`);
        }
        
        if (!session || session.expiresAt < now) {
            console.log(`❌ Session invalid or expired`);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired session' 
            });
        }

        // Refresh session timeout on successful verification
        refreshSession(sessionToken);

        // Get user invoices
        const invoices = await Invoice.find({
            $or: [
                { 'to.email': session.email },
                { 'customerEmail': session.email }
            ]
        }).sort({ createdAt: -1 }).select('-__v');

        res.json({ 
            success: true, 
            invoices: invoices,
            userEmail: session.email 
        });

    } catch (error) {
        console.error('Get user invoices error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error. Please try again later.' 
        });
    }
};

// Step 4: Get specific invoice details
exports.getInvoiceDetails = async (req, res) => {
    try {
        const { invoiceId, sessionToken } = req.query;

        if (!sessionToken) {
            return res.status(401).json({ 
                success: false, 
                message: 'Session token required' 
            });
        }

        // Verify session
        const session = global.invoiceAccessSessions?.[sessionToken];
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired session' 
            });
        }

        // Refresh session timeout on successful verification
        refreshSession(sessionToken);

        // Get specific invoice
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            $or: [
                { 'to.email': session.email },
                { 'customerEmail': session.email }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found or access denied' 
            });
        }

        res.json({ 
            success: true, 
            invoice: invoice 
        });

    } catch (error) {
        console.error('Get invoice details error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error. Please try again later.' 
        });
    }
};

// Render user invoices page
exports.getUserInvoicesPage = async (req, res) => {
    try {
        const { sessionToken } = req.query;

        if (!sessionToken) {
            return res.redirect('/?error=session_required');
        }

        // Verify session
        const session = global.invoiceAccessSessions?.[sessionToken];
        if (!session || session.expiresAt < new Date()) {
            return res.redirect('/?error=session_expired');
        }

        // Refresh session timeout on successful verification
        refreshSession(sessionToken);

        res.render('../views/user/user-invoices.ejs', {
            pageTitle: "My Invoices - Krushiyuga",
            sessionToken: sessionToken,
            userEmail: session.email
        });

    } catch (error) {
        console.error('Get user invoices page error:', error);
        res.redirect('/?error=server_error');
    }
};

// Cleanup expired sessions (call this periodically)
const cleanupExpiredSessions = () => {
    if (global.invoiceAccessSessions) {
        const now = new Date();
        const totalSessions = Object.keys(global.invoiceAccessSessions).length;
        let expiredCount = 0;
        
        Object.keys(global.invoiceAccessSessions).forEach(token => {
            if (global.invoiceAccessSessions[token].expiresAt < now) {
                console.log(`🗑️ Cleaning up expired session: ${token.substring(0, 8)}...`);
                delete global.invoiceAccessSessions[token];
                expiredCount++;
            }
        });
        
        if (expiredCount > 0) {
            console.log(`🧹 Cleanup complete: ${expiredCount} expired sessions removed. Active sessions: ${totalSessions - expiredCount}`);
        }
    }
};

// Clean up every 5 minutes and log session status
setInterval(() => {
    console.log(`\n🔔 Periodic Session Check - ${new Date().toLocaleString()}`);
    logActiveSessions();
    cleanupExpiredSessions();
    console.log('---');
}, 5 * 60 * 1000);

// PDF Download functionality
exports.downloadInvoicePDF = async (req, res) => {
    try {
        const invoiceId = req.params.invoiceId;
        const sessionToken = req.query.sessionToken;
        
        console.log('📄 User PDF Download Request:');
        console.log('- Invoice ID:', invoiceId);
        console.log('- Session Token:', sessionToken ? 'Present' : 'Missing');

        if (!sessionToken) {
            console.log('❌ No session token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'Session token required' 
            });
        }

        // Verify session
        const session = global.invoiceAccessSessions?.[sessionToken];
        console.log('- Session found:', session ? 'Yes' : 'No');
        console.log('- Session email:', session?.email);
        console.log('- Session expires:', session?.expiresAt);
        
        if (!session || session.expiresAt < new Date()) {
            console.log('❌ Invalid or expired session');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired session' 
            });
        }

        // Refresh session timeout on successful verification
        refreshSession(sessionToken);
        console.log('✅ Session refreshed, new expiry:', session.expiresAt);

        // Get specific invoice
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            $or: [
                { 'to.email': session.email },
                { 'customerEmail': session.email }
            ]
        });

        console.log('- Invoice found:', invoice ? 'Yes' : 'No');
        console.log('- Invoice number:', invoice?.invoiceNumber);
        console.log('- Invoice customer email:', invoice?.to?.email);

        if (!invoice) {
            console.log('❌ Invoice not found or access denied');
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found or access denied' 
            });
        }

        console.log('✅ Starting PDF generation with exact admin UI...');

        const PDFDocument = require('pdfkit');
        const QRCode = require('qrcode');
const path = require('path');

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
        // Add Krushiyuga logo
        try {
            const logoPath = path.join(__dirname, '../public/images/krushiyuga-logo.png');
            doc.image(logoPath, 450, yPos + 15, { width: 100, height: 40 });
        } catch (logoError) {
            console.log('Logo not found, using text fallback:', logoError);
            doc.fontSize(22).fillColor(greenColor).text('Krushiyuga', 450, yPos + 25);
        }

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
        doc.text('Taxable Value', 385, yPos + 8, { width: 40 });
        doc.text('Tax Amount', 475, yPos + 8, { width: 50 });
        doc.text('Amount', 525, yPos + 8, { width: 60 });

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
            doc.text((index + 1).toString(), 55, yPos + 12, { width: 20 });
            
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

            // Right side summary table with improved spacing and alignment
            let summaryY = yPos - 15;
            const summaryTableX = 370;
            const summaryTableWidth = 180;
            const summaryRowHeight = 22;
            
            // Table borders (adjusted for new row height)
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight * 5).strokeColor(borderColor).lineWidth(0.5).stroke();
            
            // Row 1: Taxable Amount
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();
            doc.fontSize(10).fillColor(blackColor).text('Taxable Amount', summaryTableX + 10, summaryY + 8);
            doc.fontSize(10).fillColor(blackColor).text(`₹ ${(invoice.subtotal || 0).toFixed(2)}`, summaryTableX + 110, summaryY + 8, { align: 'right', width: 60 });
            
            // Vertical separator
            doc.moveTo(summaryTableX + 100, summaryY).lineTo(summaryTableX + 100, summaryY + summaryRowHeight).stroke();
            
            summaryY += summaryRowHeight;
            
            // Row 2: IGST
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();
            doc.fontSize(10).fillColor(blackColor).text('IGST', summaryTableX + 10, summaryY + 8);
            doc.fontSize(10).fillColor(blackColor).text(`₹ ${(invoice.totalGST || 0).toFixed(2)}`, summaryTableX + 110, summaryY + 8, { align: 'right', width: 60 });
            
            // Vertical separator
            doc.moveTo(summaryTableX + 100, summaryY).lineTo(summaryTableX + 100, summaryY + summaryRowHeight).stroke();
            
            summaryY += summaryRowHeight;
            
            // Row 3: Subtotal
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight).fillColor('#f9f9f9').fill();
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();
            doc.fontSize(11).fillColor(blackColor).text('Subtotal', summaryTableX + 10, summaryY + 8);
            doc.fontSize(11).fillColor(blackColor).text(`₹ ${totalAmount.toFixed(2)}`, summaryTableX + 110, summaryY + 8, { align: 'right', width: 60 });
            
            // Vertical separator
            doc.moveTo(summaryTableX + 100, summaryY).lineTo(summaryTableX + 100, summaryY + summaryRowHeight).stroke();
            
            summaryY += summaryRowHeight;
            
            // Row 4: Discount (if any)
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();
            doc.fontSize(10).fillColor(blackColor).text('Discount', summaryTableX + 10, summaryY + 8);
            doc.fontSize(10).fillColor(blackColor).text(`₹ ${(invoice.discount || 0).toFixed(2)}`, summaryTableX + 110, summaryY + 8, { align: 'right', width: 60 });
            
            // Vertical separator
            doc.moveTo(summaryTableX + 100, summaryY).lineTo(summaryTableX + 100, summaryY + summaryRowHeight).stroke();
            
            summaryY += summaryRowHeight;
            
            // Row 5: Total Amount (highlighted)
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight).fillColor('#e8f5e8').fill();
            doc.rect(summaryTableX, summaryY, summaryTableWidth, summaryRowHeight).strokeColor(borderColor).lineWidth(1).stroke();
            doc.fontSize(12).fillColor(blackColor).text('Amount Payable', summaryTableX + 10, summaryY + 8);
            doc.fontSize(12).fillColor(blackColor).text(`₹ ${totalAmount.toFixed(2)}`, summaryTableX + 110, summaryY + 8, { align: 'right', width: 60 });
            
            // Vertical separator
            doc.moveTo(summaryTableX + 100, summaryY).lineTo(summaryTableX + 100, summaryY + summaryRowHeight).stroke();

            yPos += 60;

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

        // Bank details (exact format)
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
        console.error('❌ User PDF download error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating PDF. Please try again later.' 
        });
    }
};
