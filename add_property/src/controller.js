const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Mongoose model for Property
const propertySchema = new mongoose.Schema({
  owner_id: { type: String, required: true, index: true },
  property_name: { type: String, required: true },
  property_type: { type: String, required: true },
  description: { type: String, required: true },
  max_occupancy: { type: Number, default: null },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  pricing: {
    monthly_rent: Number,
    security_deposit: Number,
    maintenance_charges: { type: Number, default: 0 },
    utility_charges: { type: Number, default: 0 }
  },
  amenities: { type: Object, default: {} },
  rules: { type: Object, default: {} },
  images: {
    front: { type: String, default: null },
    back: { type: String, default: null },
    hall: { type: String, default: null },
    room: { type: String, default: null },
    toilet: { type: String, default: null },
    images: { type: [String], default: [] }
  },
  documents: { type: [String], default: [] },
  status: { type: String, default: 'active' }
}, { timestamps: true });

const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload images to Cloudinary
const uploadImage = async (file) => {
  try {
    console.log('Uploading image to Cloudinary:', file.originalname);
    
    // Determine file type
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';
    
    if (isPdf) {
      // Handle PDF uploads
      return await uploadDocument(file);
    }
    
    if (!isImage) {
      throw new Error('Only image files (JPG, PNG, GIF, WebP) are allowed for images');
    }
    
    console.log('File type detection:', { fileExtension, isImage });
    
    // Upload to images folder with image resource type
    const uniqueId = `img-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const uploadOptions = {
      resource_type: 'image', // Use image resource type for images
      public_id: `lyvo-properties/images/${uniqueId}`, // Include folder in public_id
      overwrite: false,
      invalidate: true, // Invalidate CDN cache
      access_mode: 'public', // Make files publicly accessible
      use_filename: false, // Don't use original filename
      unique_filename: false, // We're setting our own public_id
      type: 'upload', // Explicitly set upload type
      sign_url: false // Don't sign URLs for public access
    };
    
    console.log('Upload options:', uploadOptions);
    
    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
    
    // Delete the local file after upload
    const fs = require('fs');
    try {
      fs.unlinkSync(file.path);
      console.log('Local file deleted:', file.path);
    } catch (deleteError) {
      console.log('Could not delete local file:', deleteError.message);
    }
    
    console.log('Cloudinary upload result:', result.secure_url);
    
    return { 
      success: true, 
      url: result.secure_url,
      public_id: result.public_id,
      fileName: file.originalname
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return { success: false, error: error.message };
  }
};

// Upload PDF documents to Cloudinary
const uploadDocument = async (file) => {
  try {
    console.log('Uploading PDF to Cloudinary:', file.originalname);
    
    // Determine if it's a PDF
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const isPdf = fileExtension === 'pdf';
    
    if (!isPdf) {
      throw new Error('Only PDF files are allowed for documents');
    }
    
    console.log('File type detection:', { fileExtension, isPdf });
    
    // Upload to dedicated PDF folder with raw resource type
    const uniqueId = `pdf-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const uploadOptions = {
      resource_type: 'raw', // Use raw resource type for proper PDF handling
      format: 'pdf',
      public_id: `lyvo-properties/pdfs/${uniqueId}`, // Include folder in public_id
      overwrite: false,
      invalidate: true, // Invalidate CDN cache
      access_mode: 'public', // Make files publicly accessible
      use_filename: false, // Don't use original filename
      unique_filename: false, // We're setting our own public_id
      type: 'upload', // Explicitly set upload type
      sign_url: false // Don't sign URLs for public access
    };
    
    console.log('Upload options:', uploadOptions);
    
    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
    
    // Delete the local file after upload
    const fs = require('fs');
    try {
      fs.unlinkSync(file.path);
      console.log('Local file deleted:', file.path);
    } catch (deleteError) {
      console.log('Could not delete local file:', deleteError.message);
    }
    
    console.log('Cloudinary upload result:', result.secure_url);
    
    return { 
      success: true, 
      url: result.secure_url,
      public_id: result.public_id,
      fileName: file.originalname
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return { success: false, error: error.message };
  }
};

// Add Property
const addProperty = async (req, res) => {
  try {
    console.log('=== ADD PROPERTY REQUEST ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body propertyData:', req.body.propertyData);
    console.log('Request files:', req.files ? req.files.length : 'No files');
    
    // Parse propertyData from JSON string
    let propertyData;
    try {
      propertyData = JSON.parse(req.body.propertyData);
      console.log('Parsed propertyData:', JSON.stringify(propertyData, null, 2));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw propertyData:', req.body.propertyData);
      return res.status(400).json({ success: false, message: 'Invalid property data format' });
    }

    // Validate required fields
    if (!propertyData || !propertyData.address) {
      console.error('Missing propertyData or address:', propertyData);
      return res.status(400).json({ success: false, message: 'Property data or address is missing' });
    }
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Upload images if provided
    let imageUrls = {};
    console.log('Files received:', req.files);
    console.log('Files length:', req.files ? req.files.length : 0);
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log('Processing file:', file.fieldname, file.originalname);
        const uploadResult = await uploadImage(file);
        if (uploadResult.success) {
          // Collect arrays for images/documents
          if (file.fieldname === 'images' || file.fieldname === 'documents') {
            if (!imageUrls[file.fieldname]) imageUrls[file.fieldname] = [];
            imageUrls[file.fieldname].push(uploadResult.url);
          } else {
            imageUrls[file.fieldname] = uploadResult.url;
          }
          console.log('Upload successful:', file.fieldname, uploadResult.url);
        } else {
          console.error('Upload failed:', file.fieldname, uploadResult.error);
        }
      }
    }
    
    console.log('Final imageUrls:', imageUrls);
    
    // Map field names to database structure
    const structuredImages = {
      front: imageUrls.frontImage || null,
      back: imageUrls.backImage || null,
      hall: imageUrls.hallImage || null,
      room: imageUrls.roomImage || null,
      toilet: imageUrls.toiletImage || null,
      images: imageUrls.images || []
    };
    
    console.log('Structured images for database:', structuredImages);

    // Prepare property data
    const property = {
      owner_id: userId,
      property_name: propertyData.propertyName,
      property_type: propertyData.propertyType,
      description: propertyData.description,
      max_occupancy: Number.isFinite(parseInt(propertyData.maximumOccupancy)) ? parseInt(propertyData.maximumOccupancy) : null,
      address: {
        street: propertyData.address?.street || '',
        city: propertyData.address?.city || '',
        state: propertyData.address?.state || '',
        pincode: propertyData.address?.pincode || '',
        landmark: propertyData.address?.landmark || ''
      },
      latitude: parseFloat(propertyData.address?.latitude) || null,
      longitude: parseFloat(propertyData.address?.longitude) || null,
      pricing: {
        monthly_rent: parseFloat(propertyData.monthlyRent),
        security_deposit: parseFloat(propertyData.securityDeposit),
        maintenance_charges: parseFloat(propertyData.maintenanceCharges) || 0,
        utility_charges: parseFloat(propertyData.utilityCharges) || 0
      },
      amenities: propertyData.amenities || {},
      rules: propertyData.rules || {},
      images: structuredImages,
      documents: imageUrls.documents || [],
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Save into MongoDB
    const created = await Property.create(property);

    res.status(201).json({
      success: true,
      message: 'Property added successfully',
      data: created
    });

  } catch (error) {
    console.error('Add property error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Properties
const getProperties = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Property.find({ owner_id: userId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Property.countDocuments({ owner_id: userId })
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Single Property
const getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const property = await Property.findOne({ _id: id, owner_id: userId });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    res.json({ success: true, data: property });

  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  addProperty,
  getProperties,
  getProperty
};
