const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dobvyt9yw',
    api_key: '977591232949275',
    api_secret: 'S9Egv2i4jGUWp8IgI49FcJkjWio'
});

module.exports = cloudinary;
