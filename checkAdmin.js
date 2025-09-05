const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const mongoDBURL = 'mongodb+srv://abhishekv1808:' + encodeURIComponent('Grow@$@2025') + '@aribnb.xvmlcnz.mongodb.net/practise-invoice?retryWrites=true&w=majority&appName=aribnb';

async function checkAdminUser() {
    try {
        await mongoose.connect(mongoDBURL);
        console.log('Connected to MongoDB');
        
        const admin = await Admin.findOne({ email: 'admin@krushiyuga.com' });
        
        if (!admin) {
            console.log('❌ Admin user not found!');
            process.exit(1);
        }
        
        console.log('✅ Admin user found!');
        console.log('📧 Email:', admin.email);
        console.log('🔐 Password hash exists:', !!admin.password);
        console.log('🟢 Active:', admin.isActive);
        console.log('🔒 Login attempts:', admin.loginAttempts);
        console.log('⏱️  Last login:', admin.lastLogin || 'Never');
        console.log('🆔 Admin ID:', admin._id);
        
        if (admin.isLocked) {
            console.log('🚫 Account is LOCKED until:', admin.lockUntil);
        } else {
            console.log('🔓 Account is NOT locked');
        }
        
        console.log('\n🎯 Test these credentials:');
        console.log('Email: admin@krushiyuga.com');
        console.log('Password: Admin@123456');
        console.log('Login URL: http://localhost:3000/admin-login');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error checking admin user:', error);
        process.exit(1);
    }
}

checkAdminUser();
