const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    rate: {
        type: Number,
        required: true,
        min: 0
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    gst: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    gstAmount: {
        type: Number,
        required: true,
        min: 0
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    issueDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    
    // Business Information (Krushiyuga - always same)
    from: {
        companyName: {
            type: String,
            default: 'Krushiyuga',
            required: true
        },
        gstin: {
            type: String,
            default: '22AAAAA0000A1Z5',
            required: true
        },
        description: {
            type: String,
            default: 'Agricultural Solutions & Services',
            required: true
        },
        address: {
            type: String,
            default: 'No. 39 & 1479, DRLS Plaza Union Bank Building\nTumkur Road, Vidya Nagar, T. Dasarahalli, Bengaluru 560057',
            required: true
        },
        mobile: {
            type: String,
            default: '9876543210',
            required: true
        },
        email: {
            type: String,
            default: 'info@krushiyuga.com',
            required: true
        }
    },
    
    // Client Information
    to: {
        companyName: {
            type: String,
            required: true
        },
        contactPerson: {
            type: String
        },
        gstin: {
            type: String
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String
        },
        address: {
            type: String,
            required: true
        }
    },
    
    // Invoice Items
    items: [invoiceItemSchema],
    
    // Calculations
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    totalGST: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    
    // Additional Information
    notes: {
        type: String,
        maxlength: 500
    },
    termsAndConditions: {
        type: String,
        default: 'Payment is due within 30 days from the invoice date.'
    },
    
    // Status
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    
    // Admin who created
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
    
}, {
    timestamps: true
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
    if (!this.invoiceNumber) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        
        // Find the last invoice for this year and month
        const lastInvoice = await this.constructor.findOne({
            invoiceNumber: { $regex: `^INV-${year}${month}-` }
        }).sort({ invoiceNumber: -1 });
        
        let sequence = 1;
        if (lastInvoice) {
            const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }
        
        this.invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
    }
    next();
});

// Calculate totals before saving
invoiceSchema.pre('save', function(next) {
    // Calculate subtotal and total GST
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    this.totalGST = this.items.reduce((sum, item) => sum + item.gstAmount, 0);
    
    // Calculate discount amount
    this.discountAmount = (this.subtotal * this.discount) / 100;
    
    // Calculate total amount
    this.totalAmount = this.subtotal + this.totalGST - this.discountAmount;
    
    next();
});

// Virtual for formatted invoice number
invoiceSchema.virtual('formattedInvoiceNumber').get(function() {
    return this.invoiceNumber || 'PENDING';
});

// Virtual for formatted dates
invoiceSchema.virtual('formattedIssueDate').get(function() {
    return this.issueDate.toLocaleDateString('en-IN');
});

module.exports = mongoose.model('Invoice', invoiceSchema);
