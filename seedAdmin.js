const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const mongoDBURL = 'mongodb+srv://abhishekv1808:' + encodeURIComponent('Grow@$@2025') + '@aribnb.xvmlcnz.mongodb.net/practise-invoice?retryWrites=true&w=majority&appName=aribnb';

async function createAdminUser() {
    try {
        await mongoose.connect(mongoDBURL);
        console.log('Connected to MongoDB');
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@krushiyuga.com' });
        
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }
        
        // Create new admin user
        const adminUser = new Admin({
            email: 'admin@krushiyuga.com',
            password: 'Admin@123456',
            isActive: true
        });
        
        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@krushiyuga.com');
        console.log('Password: Admin@123456');
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
