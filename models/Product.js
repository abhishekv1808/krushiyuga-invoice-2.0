const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Seeds & Planting',
            'Fertilizers',
            'Pesticides & Herbicides',
            'Farm Tools & Equipment',
            'Irrigation Supplies',
            'Organic Products',
            'Grains & Cereals',
            'Vegetables',
            'Fruits',
            'Dairy Products',
            'Livestock Feed',
            'Other'
        ]
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'liter', 'ml', 'piece', 'packet', 'bag', 'quintal', 'ton', 'dozen', 'meter', 'feet']
    },
    quantityInStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    minimumStockLevel: {
        type: Number,
        required: true,
        min: 0,
        default: 10
    },
    supplier: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        contact: {
            type: String,
            required: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    hsn: {
        type: String,
        required: true
    },
    gst: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 18
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for low stock check
productSchema.virtual('isLowStock').get(function() {
    return this.quantityInStock <= this.minimumStockLevel;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.quantityInStock === 0) return 'Out of Stock';
    if (this.quantityInStock <= this.minimumStockLevel) return 'Low Stock';
    return 'In Stock';
});

// Pre-save middleware to update lastUpdated
productSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Generate SKU automatically if not provided
productSchema.pre('save', function(next) {
    if (!this.sku) {
        const categoryCode = this.category.substring(0, 3).toUpperCase();
        const nameCode = this.name.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        this.sku = `${categoryCode}-${nameCode}-${timestamp}`;
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
