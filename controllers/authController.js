const Admin = require('../models/Admin');

exports.getAdminLogin = (req, res, next) => {
    const errorMessage = req.session.errorMessage;
    const successMessage = req.session.successMessage;
    
    // Clear messages after displaying
    req.session.errorMessage = null;
    req.session.successMessage = null;
    
    res.render('../views/auth/adminLogin.ejs', {
        pageTitle: "Admin Login | krushiyuga",
        errorMessage: errorMessage,
        successMessage: successMessage,
        adminEmail: null // Not logged in on login page
    });
};

exports.postAdminLogin = async (req, res, next) => {
    const { email, password, 'remember-me': rememberMe } = req.body;
    
    try {
        // Input validation
        if (!email || !password) {
            req.session.errorMessage = 'Please provide both email and password.';
            return res.redirect('/admin-login');
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.session.errorMessage = 'Please enter a valid email address.';
            return res.redirect('/admin-login');
        }
        
        // Password length validation
        if (password.length < 8) {
            req.session.errorMessage = 'Password must be at least 8 characters long.';
            return res.redirect('/admin-login');
        }
        
        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            // Log failed login attempt for security monitoring
            console.log(`Failed login attempt for non-existent email: ${email} at ${new Date()}`);
            req.session.errorMessage = 'Invalid credentials. Please check your email and password.';
            return res.redirect('/admin-login');
        }
        
        // Check if admin account is active
        if (!admin.isActive) {
            console.log(`Login attempt on deactivated account: ${email} at ${new Date()}`);
            req.session.errorMessage = 'Your account has been deactivated. Please contact support.';
            return res.redirect('/admin-login');
        }
        
        // Check if account is locked
        if (admin.isLocked) {
            const lockTimeRemaining = Math.ceil((admin.lockUntil - Date.now()) / (1000 * 60));
            console.log(`Login attempt on locked account: ${email} at ${new Date()}`);
            req.session.errorMessage = `Account is temporarily locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`;
            return res.redirect('/admin-login');
        }
        
        // Verify password
        await admin.comparePassword(password);
        
        // Create session with additional security
        req.session.isLoggedIn = true;
        req.session.adminId = admin._id;
        req.session.adminEmail = admin.email;
        req.session.loginTime = new Date();
        
        // Set session duration based on remember me option
        if (rememberMe) {
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
        } else {
            req.session.cookie.maxAge = 1000 * 60 * 60 * 8; // 8 hours
        }
        
        console.log(`Successful admin login: ${email} at ${new Date()}`);
        req.session.loginSuccessMessage = 'Login successful! Welcome to the admin portal.';
        
        // Redirect to admin dashboard
        res.redirect('/admin-portal');
        
    } catch (error) {
        console.error('Admin login error:', error);
        
        if (error.message === 'Invalid credentials' || 
            error.message.includes('Account is temporarily locked')) {
            req.session.errorMessage = error.message;
        } else {
            req.session.errorMessage = 'An error occurred during login. Please try again.';
        }
        
        res.redirect('/admin-login');
    }
};

exports.postAdminLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin-login');
    });
};

// Middleware to protect admin routes
exports.requireAdminAuth = async (req, res, next) => {
    try {
        if (!req.session.isLoggedIn || !req.session.adminId) {
            req.session.errorMessage = 'Please login to access the admin portal.';
            return res.redirect('/admin-login');
        }
        
        // Check if session has expired (additional security check)
        const sessionAge = Date.now() - new Date(req.session.loginTime).getTime();
        const maxSessionAge = req.session.cookie.maxAge || (8 * 60 * 60 * 1000); // Default 8 hours
        
        if (sessionAge > maxSessionAge) {
            req.session.destroy((err) => {
                if (err) console.error('Session destruction error:', err);
            });
            req.session.errorMessage = 'Your session has expired. Please login again.';
            return res.redirect('/admin-login');
        }
        
        // Verify admin still exists and is active
        const admin = await Admin.findById(req.session.adminId);
        if (!admin || !admin.isActive) {
            req.session.destroy((err) => {
                if (err) console.error('Session destruction error:', err);
            });
            req.session.errorMessage = 'Your account is no longer active. Please contact support.';
            return res.redirect('/admin-login');
        }
        
        // Update last activity
        req.session.lastActivity = new Date();
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        req.session.errorMessage = 'Authentication error. Please login again.';
        res.redirect('/admin-login');
    }
};