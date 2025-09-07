const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Test Cloudinary configuration
console.log('Testing Cloudinary configuration...');
console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test upload with a simple base64 image
const testUpload = async () => {
  try {
    console.log('Testing Cloudinary upload with base64 image...');
    
    // Create a simple 1x1 pixel image in base64
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'lyvo-properties-test'
    });
    
    console.log('✅ Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Folder:', result.folder);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Full error:', error);
  }
};

testUpload();