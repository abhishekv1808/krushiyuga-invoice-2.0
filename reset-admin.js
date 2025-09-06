const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const mongoDBURL = process.env.MONGODB_URI || 'mongodb+srv://abhishekv1808:' + encodeURIComponent('Grow@$@2025') + '@aribnb.xvmlcnz.mongodb.net/practise-invoice?retryWrites=true&w=majority&appName=aribnb';

async function resetAdminUser() {
    try {
        await mongoose.connect(mongoDBURL);
        console.log('Connected to MongoDB');
        
        // Delete existing admin user
        const deleteResult = await Admin.deleteOne({ email: 'admin@krushiyuga.com' });
        console.log('Deleted existing admin:', deleteResult);
        
        // Create new admin user
        const adminUser = new Admin({
            email: 'admin@krushiyuga.com',
            password: 'Admin@123456',
            isActive: true
        });
        
        await adminUser.save();
        console.log('✅ Admin user recreated successfully!');
        console.log('Email: admin@krushiyuga.com');
        console.log('Password: Admin@123456');
        
        // Test the new password
        const testAdmin = await Admin.findOne({ email: 'admin@krushiyuga.com' });
        await testAdmin.comparePassword('Admin@123456');
        console.log('✅ Password verification test passed!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error resetting admin user:', error);
        process.exit(1);
    }
}

resetAdminUser();
