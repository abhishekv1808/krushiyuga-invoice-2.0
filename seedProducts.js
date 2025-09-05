const mongoose = require('mongoose');
const Product = require('./models/Product');

const mongoDBURL = 'mongodb+srv://abhishekv1808:' + encodeURIComponent('Grow@$@2025') + '@aribnb.xvmlcnz.mongodb.net/practise-invoice?retryWrites=true&w=majority&appName=aribnb';

const sampleProducts = [
    {
        name: 'Organic Wheat Seeds',
        category: 'Seeds & Planting',
        description: 'High-quality organic wheat seeds suitable for all soil types. Disease resistant variety with excellent yield potential.',
        price: 45.00,
        unit: 'kg',
        quantityInStock: 500,
        minimumStockLevel: 50,
        supplier: {
            name: 'Green Farms Pvt Ltd',
            contact: '+91-9876543210',
            email: 'orders@greenfarms.com'
        },
        sku: 'SEE-ORG-001',
        hsn: '1001',
        gst: 5
    },
    {
        name: 'NPK Fertilizer 12:32:16',
        category: 'Fertilizers',
        description: 'Balanced NPK fertilizer with optimal nitrogen, phosphorus, and potassium ratio for healthy plant growth.',
        price: 850.00,
        unit: 'bag',
        quantityInStock: 75,
        minimumStockLevel: 10,
        supplier: {
            name: 'Agro Chemical Solutions',
            contact: '+91-9123456789',
            email: 'sales@agrochem.com'
        },
        sku: 'FER-NPK-001',
        hsn: '3105',
        gst: 18
    },
    {
        name: 'Organic Neem Oil',
        category: 'Pesticides & Herbicides',
        description: 'Pure organic neem oil for natural pest control. Safe for humans, animals, and beneficial insects.',
        price: 320.00,
        unit: 'liter',
        quantityInStock: 120,
        minimumStockLevel: 20,
        supplier: {
            name: 'Natural Pest Control Co.',
            contact: '+91-8765432109',
            email: 'info@naturalpest.com'
        },
        sku: 'PES-NEE-001',
        hsn: '1515',
        gst: 12
    },
    {
        name: 'Hand Weeder Tool',
        category: 'Farm Tools & Equipment',
        description: 'Ergonomic hand weeder tool for efficient weed removal. Durable steel construction with comfortable grip.',
        price: 185.00,
        unit: 'piece',
        quantityInStock: 45,
        minimumStockLevel: 5,
        supplier: {
            name: 'Farm Tool Industries',
            contact: '+91-7654321098',
            email: 'sales@farmtools.com'
        },
        sku: 'TOO-WEE-001',
        hsn: '8201',
        gst: 18
    },
    {
        name: 'Drip Irrigation Kit',
        category: 'Irrigation Supplies',
        description: 'Complete drip irrigation kit for 1-acre coverage. Includes drippers, pipes, and control valves.',
        price: 12500.00,
        unit: 'piece',
        quantityInStock: 15,
        minimumStockLevel: 3,
        supplier: {
            name: 'Irrigation Systems Ltd',
            contact: '+91-6543210987',
            email: 'orders@irrigationsys.com'
        },
        sku: 'IRR-DRI-001',
        hsn: '8424',
        gst: 18
    },
    {
        name: 'Organic Compost',
        category: 'Organic Products',
        description: 'Rich organic compost made from cow dung and plant matter. Improves soil fertility naturally.',
        price: 280.00,
        unit: 'bag',
        quantityInStock: 200,
        minimumStockLevel: 30,
        supplier: {
            name: 'Organic Matter Co.',
            contact: '+91-5432109876',
            email: 'sales@organicmatter.com'
        },
        sku: 'ORG-COM-001',
        hsn: '3101',
        gst: 5
    },
    {
        name: 'Basmati Rice Seeds',
        category: 'Seeds & Planting',
        description: 'Premium basmati rice seeds with excellent aroma and grain length. High market value variety.',
        price: 125.00,
        unit: 'kg',
        quantityInStock: 300,
        minimumStockLevel: 25,
        supplier: {
            name: 'Rice Seed Suppliers',
            contact: '+91-4321098765',
            email: 'info@riceseeds.com'
        },
        sku: 'SEE-BAS-001',
        hsn: '1006',
        gst: 5
    },
    {
        name: 'Tomato Seeds (Hybrid)',
        category: 'Vegetables',
        description: 'High-yield hybrid tomato seeds. Disease resistant with excellent fruit quality and shelf life.',
        price: 2500.00,
        unit: 'packet',
        quantityInStock: 80,
        minimumStockLevel: 10,
        supplier: {
            name: 'Hybrid Seeds International',
            contact: '+91-3210987654',
            email: 'orders@hybridseeds.com'
        },
        sku: 'VEG-TOM-001',
        hsn: '1209',
        gst: 5
    },
    {
        name: 'Cattle Feed Pellets',
        category: 'Livestock Feed',
        description: 'Nutritious cattle feed pellets with balanced protein, vitamins, and minerals for healthy livestock.',
        price: 1850.00,
        unit: 'bag',
        quantityInStock: 60,
        minimumStockLevel: 8,
        supplier: {
            name: 'Animal Nutrition Ltd',
            contact: '+91-2109876543',
            email: 'sales@animalnutrition.com'
        },
        sku: 'FEE-CAT-001',
        hsn: '2309',
        gst: 5
    },
    {
        name: 'Garden Hose 50ft',
        category: 'Irrigation Supplies',
        description: 'Flexible garden hose 50 feet length. UV resistant and kink-free design for long-lasting use.',
        price: 890.00,
        unit: 'piece',
        quantityInStock: 25,
        minimumStockLevel: 5,
        supplier: {
            name: 'Garden Supplies Co.',
            contact: '+91-1098765432',
            email: 'info@gardensupplies.com'
        },
        sku: 'IRR-HOS-001',
        hsn: '3917',
        gst: 18
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(mongoDBURL);
        console.log('Connected to MongoDB');
        
        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');
        
        // Insert sample products
        const insertedProducts = await Product.insertMany(sampleProducts);
        console.log(`✅ Added ${insertedProducts.length} sample products successfully!`);
        
        console.log('\n📦 Sample Products Added:');
        insertedProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ₹${product.price} per ${product.unit} (${product.quantityInStock} in stock)`);
        });
        
        console.log('\n🎯 Access your products at: http://localhost:3000/products');
        console.log('📧 Login with: admin@krushiyuga.com / Admin@123456');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();
