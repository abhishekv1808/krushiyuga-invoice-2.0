# Krushiyuga Invoice Management System 2.0 🌾

A comprehensive invoice management system designed specifically for agricultural businesses in India. Built with Node.js, Express, MongoDB, and featuring modern responsive design.

## 🚀 Features

### 🔐 Authentication & Security
- **Secure Admin Login** with bcrypt password hashing
- **Session Management** with MongoDB store
- **Account Locking** after failed login attempts
- **Route Protection** middleware

### 📦 Product Management
- **Complete CRUD Operations** for agricultural products
- **Advanced Search & Filtering** by name, category, supplier
- **Pagination** for large product catalogs
- **Stock Management** with low stock alerts
- **Product Categories**: Seeds, Fertilizers, Pesticides, Tools, Equipment
- **Auto SKU Generation** for products
- **GST Rate Management** per product

### 🧾 Invoice Generation
- **Product Selection** from database with auto-population
- **GST Calculations** compliant with Indian tax system
- **Hardcoded Business Information** for Krushiyuga
- **Real-time Calculations** for subtotal, GST, discount, and total
- **Multiple Payment Terms** including advance payments
- **Indian Rupee (₹) Currency** support

### 🎨 Modern UI/UX
- **Responsive Design** with Tailwind CSS
- **Interactive Dashboard** with statistics
- **Modern Card-based Layout**
- **Mobile-friendly Interface**
- **Smooth Animations** and transitions

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS templating, Tailwind CSS
- **Authentication**: bcryptjs, express-session
- **Security**: Session-based authentication with route protection

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/abhishekv1808/krushiyuga-invoice-2.0.git
   cd krushiyuga-invoice-2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the connection string in `app.js` if needed

4. **Seed the database**
   ```bash
   # Create admin user (admin@krushiyuga.com / Admin@123456)
   node seedAdmin.js
   
   # Add sample agricultural products
   node seedProducts.js
   ```

5. **Start the application**
   ```bash
   npm start
   # or
   node app.js
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - Admin login: `http://localhost:3000/auth/admin/login`

## 👤 Default Admin Credentials

- **Email**: admin@krushiyuga.com
- **Password**: Admin@123456

## 📁 Project Structure

```
krushiyuga-invoice-2.0/
├── controllers/
│   ├── adminController.js      # Admin & product management
│   ├── authController.js       # Authentication logic
│   └── userController.js       # User-facing routes
├── models/
│   ├── Admin.js               # Admin user schema
│   ├── Invoice.js             # Invoice schema
│   └── Product.js             # Product schema
├── routes/
│   ├── adminRouter.js         # Admin routes
│   ├── authRouter.js          # Authentication routes
│   └── userRouter.js          # User routes
├── views/
│   ├── admin/                 # Admin panel templates
│   ├── auth/                  # Login templates
│   ├── partials/              # Reusable components
│   └── user/                  # User-facing templates
├── public/
│   ├── images/                # Static images
│   └── output.css             # Tailwind CSS output
└── utils/
    └── mainUtils.js           # Utility functions
```

## 🌾 Business Information

**Krushiyuga Agricultural Solutions & Services**
- GSTIN: 22AAAAA0000A1Z5
- Address: No. 39 & 1479, DRLS Plaza Union Bank Building, Tumkur Road, Vidya Nagar, T. Dasarahalli, Bengaluru 560057
- Phone: 9876543210
- Email: info@krushiyuga.com

## 📊 Key Features in Detail

### Product Management
- **Categories**: Seeds, Fertilizers, Pesticides, Tools, Equipment, Irrigation, Storage
- **Inventory Tracking**: Stock quantity with low stock alerts
- **Supplier Information**: Manage supplier details and contact information
- **Pricing**: Purchase price, selling price, and margin calculations
- **GST Compliance**: HSN codes and GST rates for each product

### Invoice System
- **Auto-numbering**: Automatic invoice number generation (KRU-2025-XXXX)
- **Product Integration**: Select products from database with auto-filled details
- **Tax Calculations**: Automatic GST calculation per item and total
- **Flexible Pricing**: Editable rates while maintaining product defaults
- **Discount Management**: Percentage-based discounts
- **Payment Terms**: Multiple payment options for agricultural businesses

## 🔧 Configuration

Update the MongoDB connection string in `app.js`:
```javascript
mongoose.connect('mongodb://localhost:27017/krushiyuga-invoice', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

**Abhishek V**
- GitHub: [@abhishekv1808](https://github.com/abhishekv1808)
- Email: abhishek.v1808@gmail.com

## 🙏 Acknowledgments

- Built for Krushiyuga Agricultural Solutions & Services
- Tailwind CSS for the beautiful UI components
- MongoDB for reliable data storage
- Express.js for the robust backend framework

---

**Made with ❤️ for Indian Agriculture** 🇮🇳
