const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const Product = require('./models/Product');
const Admin = require('./models/Admin');

const mongoDBURL = 'mongodb+srv://abhishekv1808:' + encodeURIComponent('Grow@$@2025') + '@aribnb.xvmlcnz.mongodb.net/practise-invoice?retryWrites=true&w=majority&appName=aribnb';

async function seedData() {
    try {
        await mongoose.connect(mongoDBURL);
        console.log('Connected to MongoDB');

        // Create an admin first
        let admin = await Admin.findOne({ email: 'admin@krushiyuga.com' });
        if (!admin) {
            admin = await Admin.create({
                email: 'admin@krushiyuga.com',
                password: 'admin123' // This will be hashed automatically by the pre-save hook
            });
            console.log('Admin created');
        }

        // Create a sample product first
        const product = await Product.create({
            name: 'Sample Fertilizer',
            price: 500,
            description: 'This is a sample fertilizer product for testing',
            category: 'Fertilizers',
            unit: 'kg',
            quantityInStock: 100,
            minimumStockLevel: 10,
            supplier: {
                name: 'ABC Suppliers',
                contact: '+91 9876543210',
                email: 'abc@suppliers.com'
            },
            sku: 'FER-SAM-001',
            hsn: '31010000',
            gst: 18
        });

        // Create sample invoices
        const invoices = [
            {
                to: {
                    companyName: 'ABC Corporation',
                    email: 'contact@abc.com',
                    phone: '+91 8765432109',
                    address: 'Business District, Mumbai, India'
                },
                items: [{
                    product: product._id,
                    productName: 'Sample Fertilizer',
                    description: 'High quality organic fertilizer',
                    quantity: 2,
                    unit: 'kg',
                    rate: 500,
                    amount: 1000,
                    gst: 18,
                    gstAmount: 180
                }],
                notes: 'Thank you for your business!',
                createdBy: admin._id
            },
            {
                to: {
                    companyName: 'XYZ Ltd',
                    email: 'hello@xyz.com',
                    phone: '+91 7654321098',
                    address: 'Corporate Center, Delhi, India'
                },
                items: [{
                    product: product._id,
                    productName: 'Sample Fertilizer',
                    description: 'Premium agricultural fertilizer',
                    quantity: 3,
                    unit: 'kg',
                    rate: 500,
                    amount: 1500,
                    gst: 18,
                    gstAmount: 270
                }],
                notes: 'Payment due in 30 days',
                createdBy: admin._id
            },
            {
                to: {
                    companyName: 'Tech Solutions Inc',
                    email: 'admin@techsolutions.com',
                    phone: '+91 6543210987',
                    address: 'Innovation Hub, Pune, India'
                },
                items: [{
                    product: product._id,
                    productName: 'Sample Fertilizer',
                    description: 'Specialized farming fertilizer',
                    quantity: 1,
                    unit: 'kg',
                    rate: 500,
                    amount: 500,
                    gst: 18,
                    gstAmount: 90
                }],
                notes: 'Invoice for consultation services',
                createdBy: admin._id
            }
        ];

        await Invoice.insertMany(invoices);
        console.log('Sample invoices created successfully!');
        console.log(`Created ${invoices.length} invoices and 1 product`);

        mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding data:', error);
        mongoose.disconnect();
    }
}

seedData();
