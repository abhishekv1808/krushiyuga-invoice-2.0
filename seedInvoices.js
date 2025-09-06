const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const Admin = require('./models/Admin');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');

async function seedInvoices() {
    try {
        // Load environment variables
        require('dotenv').config();
        
        // Connect to MongoDB using the same connection as the main app
        console.log('Connecting to MongoDB...');
        const mongoDBURL = process.env.MONGODB_URI || 'mongodb+srv://abhishekv1808:' + encodeURIComponent('Grow@$@2025') + '@aribnb.xvmlcnz.mongodb.net/practise-invoice?retryWrites=true&w=majority&appName=aribnb';
        await mongoose.connect(mongoDBURL);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Invoice.deleteMany({});
        await Admin.deleteMany({});
        await Product.deleteMany({});
        console.log('Cleared existing data');

        // Create sample admin
        const admin = new Admin({
            email: 'admin@krushiyuga.com',
            password: 'admin123', // Let the pre-save hook handle hashing
            isActive: true
        });
        await admin.save();
        console.log('✅ Created admin user');

        // Create sample products
        const products = [
            {
                name: 'Organic Compost',
                category: 'Organic Products',
                description: 'Rich organic compost made from cow dung and plant material that will fertilize soil fertility naturally.',
                price: 280,
                unit: 'bag',
                quantityInStock: 100,
                minimumStockLevel: 10,
                supplier: {
                    name: 'Green Earth Suppliers',
                    contact: '9876543210',
                    email: 'supplier@greenearth.com'
                },
                sku: 'ORG-COM-001',
                hsn: '31010100',
                gst: 5,
                isActive: true
            },
            {
                name: 'NPK Fertilizer',
                category: 'Fertilizers',
                description: 'Balanced NPK fertilizer for all crops',
                price: 150,
                unit: 'kg',
                quantityInStock: 50,
                minimumStockLevel: 5,
                supplier: {
                    name: 'Agro Chemical Suppliers',
                    contact: '9876543211',
                    email: 'supplier@agrochem.com'
                },
                sku: 'FER-NPK-001',
                hsn: '31059099',
                gst: 5,
                isActive: true
            },
            {
                name: 'Mixed Vegetable Seeds',
                category: 'Seeds & Planting',
                description: 'Premium quality vegetable seeds pack',
                price: 50,
                unit: 'packet',
                quantityInStock: 200,
                minimumStockLevel: 20,
                supplier: {
                    name: 'Premium Seeds Co.',
                    contact: '9876543212',
                    email: 'supplier@premiumseeds.com'
                },
                sku: 'SEE-VEG-001',
                hsn: '12090910',
                gst: 5,
                isActive: true
            },
            {
                name: 'Tractor Rental',
                category: 'Farm Tools & Equipment',
                description: 'Agricultural equipment rental service',
                price: 2000,
                unit: 'piece',
                quantityInStock: 5,
                minimumStockLevel: 1,
                supplier: {
                    name: 'Farm Equipment Rentals',
                    contact: '9876543213',
                    email: 'supplier@farmrentals.com'
                },
                sku: 'EQU-TRA-001',
                hsn: '87019090',
                gst: 18,
                isActive: true
            }
        ];

        const createdProducts = await Product.insertMany(products);
        console.log('✅ Created sample products');

        // Create sample invoices with proper references
        const sampleInvoices = [
            {
                to: {
                    companyName: 'ABC Company',
                    contactPerson: 'John Doe',
                    email: 'john@example.com',
                    phone: '9876543210',
                    address: '123 Main Street, City, State - 123456',
                    gstin: '29ABCDE1234F1Z5'
                },
                items: [
                    {
                        product: createdProducts[0]._id, // Organic Compost
                        productName: createdProducts[0].name,
                        description: createdProducts[0].description,
                        quantity: 2,
                        unit: createdProducts[0].unit,
                        rate: createdProducts[0].price,
                        amount: 2 * createdProducts[0].price,
                        gst: createdProducts[0].gst,
                        gstAmount: (2 * createdProducts[0].price * createdProducts[0].gst) / 100
                    },
                    {
                        product: createdProducts[1]._id, // NPK Fertilizer
                        productName: createdProducts[1].name,
                        description: createdProducts[1].description,
                        quantity: 1,
                        unit: createdProducts[1].unit,
                        rate: createdProducts[1].price,
                        amount: 1 * createdProducts[1].price,
                        gst: createdProducts[1].gst,
                        gstAmount: (1 * createdProducts[1].price * createdProducts[1].gst) / 100
                    }
                ],
                status: 'sent',
                issueDate: new Date(),
                notes: 'Thank you for your business!',
                createdBy: admin._id
            },
            {
                to: {
                    companyName: 'XYZ Industries',
                    contactPerson: 'Jane Smith',
                    email: 'jane@example.com',
                    phone: '9876543211',
                    address: '456 Oak Avenue, City, State - 654321',
                    gstin: '29XYZAB1234F1Z5'
                },
                items: [
                    {
                        product: createdProducts[2]._id, // Mixed Vegetable Seeds
                        productName: createdProducts[2].name,
                        description: createdProducts[2].description,
                        quantity: 5,
                        unit: createdProducts[2].unit,
                        rate: createdProducts[2].price,
                        amount: 5 * createdProducts[2].price,
                        gst: createdProducts[2].gst,
                        gstAmount: (5 * createdProducts[2].price * createdProducts[2].gst) / 100
                    }
                ],
                status: 'paid',
                issueDate: new Date(),
                discount: 5, // 5% discount
                notes: 'Seeds for organic farming',
                createdBy: admin._id
            },
            {
                to: {
                    companyName: 'Test Company',
                    contactPerson: 'Test User',
                    email: 'test@test.com',
                    phone: '1234567890',
                    address: '789 Test Street, Test City, Test State - 111111',
                    gstin: '29TESTAB1234F1Z5'
                },
                items: [
                    {
                        product: createdProducts[3]._id, // Tractor Rental
                        productName: createdProducts[3].name,
                        description: createdProducts[3].description,
                        quantity: 1,
                        unit: createdProducts[3].unit,
                        rate: createdProducts[3].price,
                        amount: 1 * createdProducts[3].price,
                        gst: createdProducts[3].gst,
                        gstAmount: (1 * createdProducts[3].price * createdProducts[3].gst) / 100
                    }
                ],
                status: 'sent',
                issueDate: new Date(),
                discount: 2.5, // 2.5% discount
                notes: 'Equipment rental for farming operations',
                createdBy: admin._id
            }
        ];

        // Insert sample invoices one by one to handle auto-generation
        const createdInvoices = [];
        for (const invoiceData of sampleInvoices) {
            const invoice = new Invoice(invoiceData);
            await invoice.save();
            createdInvoices.push(invoice);
        }
        console.log(`✅ Created ${createdInvoices.length} sample invoices:`);
        
        createdInvoices.forEach((invoice, index) => {
            console.log(`${index + 1}. ${invoice.invoiceNumber} - ${invoice.to.email} - ₹${invoice.totalAmount.toFixed(2)}`);
        });

        await mongoose.disconnect();
        console.log('\n🎉 Database seeded successfully!');
        console.log('\nYou can now test with these emails:');
        console.log('- john@example.com');
        console.log('- jane@example.com');
        console.log('- test@test.com');
        console.log('\nAdmin login:');
        console.log('- Email: admin@krushiyuga.com');
        console.log('- Password: admin123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedInvoices();
