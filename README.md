# KrushiYuga Admin Portal 🌾

An admin-only invoice management system for KrushiYuga. This application provides comprehensive invoice management capabilities exclusively for administrators.

## 🚀 Features

### 🔐 Admin Authentication
- **Secure Admin Login** with bcrypt password hashing
- **Session Management** with MongoDB store
- **Route Protection** middleware for admin-only access

### 🧾 Invoice Management
- **Complete CRUD Operations** for invoices
- **Professional PDF Generation** with QR codes
- **GST Calculations** compliant with Indian tax system
- **Indian Rupee (₹) Currency** support with proper formatting
- **Real-time Calculations** for subtotal, GST, discount, and total

### 📊 Admin Dashboard
- **Invoice Statistics** and overview
- **Search and Filter** invoice functionality
- **Bulk Operations** for invoice management

### 🎨 Modern UI/UX
- **Responsive Design** with Tailwind CSS
- **Professional Admin Interface**
- **Mobile-friendly Layout**
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
## 📋 Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **PDF Generation**: PDFKit
- **QR Code**: qrcode library
- **Template Engine**: EJS
- **Authentication**: bcrypt for password hashing
- **Session**: express-session
- **Styling**: Tailwind CSS

## 🔑 Admin Credentials

- **Email**: admin@krushiyuga.com
- **Password**: Admin@123456

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd practise-15
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your MongoDB connection string:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the admin portal**
   - Open `http://localhost:3000`
   - Login with admin credentials above
   - Open your browser and go to `http://localhost:3000`
   - Admin login: `http://localhost:3000/auth/admin/login`

## 👤 Default Admin Credentials

- **Email**: admin@krushiyuga.com
- **Password**: Admin@123456

## 📁 Project Structure

```
practise-15/
├── controllers/
│   ├── adminController.js      # Admin operations and invoice management
│   ├── authController.js       # Authentication logic
│   └── userController.js       # Placeholder (empty)
├── models/                     # Database models
├── routes/
│   ├── adminRouter.js         # Admin routes
│   ├── authRouter.js          # Authentication routes
│   └── userRouter.js          # Placeholder (empty)
├── views/
│   ├── admin/                 # Admin panel templates
│   ├── auth/                  # Login templates
│   └── partials/              # Reusable components
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

## 📊 Admin Features

### Invoice Management
- **Create Invoices**: Generate new invoices with client details
- **View All Invoices**: Browse complete invoice list with search
- **Edit Invoices**: Modify existing invoice details
- **Delete Invoices**: Remove invoices from system
- **PDF Generation**: Download professional invoices with QR codes

### Invoice System
- **Auto-numbering**: Automatic invoice number generation (KRU-2025-XXXX)
- **Tax Calculations**: Automatic GST calculation per item and total
- **Flexible Pricing**: Editable rates while maintaining product defaults
- **Discount Management**: Percentage-based discounts
- **Payment Terms**: Multiple payment options for agricultural businesses

- **Currency Support**: Indian Rupee (₹) with proper formatting
- **Professional PDFs**: QR codes and company branding
- **Responsive Design**: Works on all devices

## 🔧 API Endpoints

### Authentication
- `POST /auth/admin/login` - Admin login

### Admin Panel
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/invoices` - List all invoices
- `POST /admin/create-invoice` - Create new invoice
- `PUT /admin/edit-invoice/:id` - Edit invoice
- `DELETE /admin/delete-invoice/:id` - Delete invoice
- `GET /admin/download-invoice/:id` - Download invoice PDF

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 📞 Contact

For support or inquiries, please contact the development team.

---

**Admin-Only Invoice Management System** �
