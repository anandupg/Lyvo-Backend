const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const Razorpay = require('razorpay');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');

// Room Schema for individual rooms
const roomSchema = new mongoose.Schema({
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  room_number: { type: Number, required: true },
  room_type: { type: String, required: true, enum: ['Single', 'Double', 'Triple', 'Quad', 'Master', 'Studio'] },
  room_size: { type: Number, required: true },
  bed_type: { type: String, required: true, enum: ['Single Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Bunk Bed', 'No Bed'] },
  occupancy: { type: Number, required: true },
  rent: { type: Number, required: true },
  amenities: {
    ac: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    tv: { type: Boolean, default: false },
    fridge: { type: Boolean, default: false },
    wardrobe: { type: Boolean, default: false },
    studyTable: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    attachedBathroom: { type: Boolean, default: false }
  },
  description: { type: String, default: '' },
  room_image: { type: String, default: null },
  toilet_image: { type: String, default: null },
  is_available: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  // Admin approval for rooms
  approval_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved: { type: Boolean, default: false },
  approved_at: { type: Date, default: null },
  approved_by: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true });


// Main Property Schema
const propertySchema = new mongoose.Schema({
  owner_id: { type: String, required: true, index: true },
  property_name: { type: String, required: true },
  description: { type: String, required: true },
  property_mode: { type: String, enum: ['room'], required: true, default: 'room' },
  
  // Address Information
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: '' }
  },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  
  // Pricing Information
  security_deposit: { type: Number, required: true },
  
  // Property-level Amenities
  amenities: {
    parking4w: { type: Boolean, default: false },
    parking2w: { type: Boolean, default: false },
    kitchen: { type: Boolean, default: false },
    powerBackup: { type: Boolean, default: false }
  },
  
  // Rules and Policies
  rules: {
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    visitorsAllowed: { type: Boolean, default: true },
    cookingAllowed: { type: Boolean, default: true }
  },
  
  // Property Images
  images: {
    front: { type: String, default: null },
    back: { type: String, default: null },
    hall: { type: String, default: null },
    kitchen: { type: String, default: null },
    gallery: { type: [String], default: [] }
  },
  
  // Outside Toilet
  toilet_outside: { type: Boolean, default: false },
  outside_toilet_image: { type: String, default: null },
  
  // Documents
  land_tax_receipt: { type: String, default: null },
  
  // Status and Approval
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'maintenance'] },
  approval_status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  approved: { type: Boolean, default: false },
  approved_at: { type: Date, default: null },
  approved_by: { type: String, default: null },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models
const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
const Booking = require('./models/Booking');
const Favorite = require('./models/Favorite');
const Tenant = require('./models/Tenant');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// SendGrid config
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid configured for email notifications');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not found. Email notifications will not be sent.');
}

// Razorpay config
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RL5vMta3bKvRd4',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '9qxxugjEleGtcqcOjWFmCB2n'
});

// Upload images to Cloudinary
const uploadImage = async (file) => {
  try {
    console.log('=== UPLOAD IMAGE FUNCTION CALLED ===');
    console.log('Uploading image to Cloudinary:', file.originalname);
    console.log('Cloudinary config check:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
    });
    
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
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
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid property data format' });
    }

    // Validate required fields
    if (!propertyData || !propertyData.address) {
      console.error('Missing propertyData or address:', propertyData);
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Property data or address is missing' });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Upload images if provided
    let imageUrls = {};
    console.log('Files received:', req.files);
    console.log('Files type:', typeof req.files);
    console.log('Files is array:', Array.isArray(req.files));
    console.log('Files keys:', req.files ? Object.keys(req.files) : 'no files');
    console.log('Files length:', req.files ? Object.keys(req.files).length : 0);
    
    const roomsUploads = {};
    let dormitoryImages = [];
    let dormitoryToiletImage = null;

    if (req.files && Object.keys(req.files).length > 0) {
      console.log('=== ENTERING FILE PROCESSING LOOP ===');
      // Convert req.files object to array of files
      const allFiles = [];
      Object.values(req.files).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          allFiles.push(...fileArray);
        } else {
          allFiles.push(fileArray);
        }
      });
      
      for (const file of allFiles) {
        console.log('Processing file:', file.fieldname, file.originalname);
        console.log('File path:', file.path);
        console.log('File exists:', require('fs').existsSync(file.path));
        try {
        const uploadResult = await uploadImage(file);
          console.log('Upload result for', file.fieldname, ':', uploadResult);
        if (uploadResult.success) {
          // Handle different file types
          if (file.fieldname === 'images') {
            if (!imageUrls.gallery) imageUrls.gallery = [];
            imageUrls.gallery.push(uploadResult.url);
          } else if (/^rooms\[\d+\]\[(roomImage|toiletImage)\]$/.test(file.fieldname)) {
            // Handle per-room uploads like rooms[0][roomImage]
            const match = file.fieldname.match(/^rooms\[(\d+)\]\[(roomImage|toiletImage)\]$/);
            const idx = parseInt(match[1]);
            const key = match[2];
            roomsUploads[idx] = roomsUploads[idx] || {};
            roomsUploads[idx][key] = uploadResult.url;
          } else if (file.fieldname === 'dormitoryImages') {
            dormitoryImages.push(uploadResult.url);
          } else if (file.fieldname === 'dormitoryToiletImage') {
            dormitoryToiletImage = uploadResult.url;
          } else if (file.fieldname === 'outsideToiletImage') {
            imageUrls.outsideToiletImage = uploadResult.url;
          } else if (file.fieldname === 'landTaxReceipt') {
            imageUrls.landTaxReceipt = uploadResult.url;
          } else {
            imageUrls[file.fieldname] = uploadResult.url;
          }
          console.log('Upload successful:', file.fieldname, uploadResult.url);
        } else {
          console.error('Upload failed:', file.fieldname, uploadResult.error);
          }
        } catch (uploadError) {
          console.error('Upload error for file:', file.fieldname, uploadError);
          console.error('Upload error details:', uploadError.message);
          console.error('Upload error stack:', uploadError.stack);
          // Continue processing other files even if one fails
        }
      }
    }
    
    console.log('Final imageUrls:', imageUrls);
    
    // Create the main property document with proper validation
    const address = propertyData.address || {};
    const propertyDataToSave = {
      owner_id: userId,
      property_name: propertyData.propertyName || '',
      description: propertyData.description || '',
      property_mode: propertyData.propertyMode || 'room',
      address: {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        landmark: address.landmark || ''
      },
      latitude: parseFloat(address.latitude) || null,
      longitude: parseFloat(address.longitude) || null,
      security_deposit: parseFloat(propertyData.securityDeposit) || 0,
      amenities: propertyData.amenities || {},
      rules: propertyData.rules || {},
      images: {
        front: imageUrls.frontImage || null,
        back: imageUrls.backImage || null,
        hall: imageUrls.hallImage || null,
        kitchen: imageUrls.kitchenImage || null,
        gallery: imageUrls.gallery || []
      },
      toilet_outside: Boolean(propertyData.toiletOutside),
      outside_toilet_image: imageUrls.outsideToiletImage || null,
      land_tax_receipt: imageUrls.landTaxReceipt || null,
      status: 'active',
      approval_status: 'pending',
      approved: false,
      approved_at: null,
      approved_by: null
    };

    // Create the property
    const createdProperty = await Property.create([propertyDataToSave], { session });
    const propertyId = createdProperty[0]._id;

    console.log('Created property with ID:', propertyId);

    // Handle room-based property (only room mode supported)
    const rooms = Array.isArray(propertyData.rooms) ? propertyData.rooms : [];
    const roomDocuments = rooms.map((room, index) => ({
      property_id: propertyId,
      room_number: parseInt(room.roomNumber) || (index + 1),
      room_type: room.roomType || '',
      room_size: parseInt(room.roomSize) || 0,
      bed_type: room.bedType || '',
      occupancy: parseInt(room.occupancy) || 1,
      rent: parseFloat(room.rent) || 0,
      amenities: room.amenities || {},
      description: room.description || '',
      room_image: roomsUploads[index]?.roomImage || null,
      toilet_image: roomsUploads[index]?.toiletImage || null,
      is_available: true
    }));

    if (roomDocuments.length > 0) {
      await Room.create(roomDocuments, { session });
      console.log(`Created ${roomDocuments.length} rooms for property ${propertyId}`);
    }

    // Commit the transaction
    await session.commitTransaction();
    console.log('Transaction committed successfully');

    res.status(201).json({
      success: true,
      message: 'Property added successfully',
      data: {
        property: createdProperty[0],
        mode: propertyData.propertyMode
      }
    });

  } catch (error) {
    console.error('Add property error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    await session.abortTransaction();
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    session.endSession();
  }
};

// Get Properties (owner-scoped)
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

    // Populate rooms data for each property
    const populatedItems = await Promise.all(
      items.map(async (property) => {
        const propertyObj = property.toObject();
        
        // Only room mode supported
        const rooms = await Room.find({ property_id: property._id });
        propertyObj.rooms = rooms;
        
        return propertyObj;
      })
    );

    res.json({
      success: true,
      data: populatedItems,
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

// Get all properties for admin with rooms and owner info
const getAllPropertiesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Property.find({}).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Property.countDocuments({})
    ]);

    // Populate rooms and fetch owner details from user-service
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';

    const enriched = await Promise.all(items.map(async (p) => {
      const propertyObj = p.toObject();
      const rooms = await Room.find({ property_id: p._id });
      propertyObj.rooms = rooms;

      // fetch owner profile minimal
      try {
        const resp = await fetch(`${USER_SERVICE_URL}/public/user/${p.owner_id}`, {
          headers: { 
            'Content-Type': 'application/json'
          }
        });
        if (resp.ok) {
          const u = await resp.json();
          propertyObj.owner = { id: p.owner_id, name: u.name || u.email || 'Unknown', email: u.email };
        } else {
          propertyObj.owner = { id: p.owner_id, name: 'Unknown', email: null };
        }
      } catch (e) {
        propertyObj.owner = { id: p.owner_id, name: 'Unknown', email: null };
      }

      return propertyObj;
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin get all properties error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Approve or reject a property (admin)
const approvePropertyAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // 'approve' | 'reject', optional reason for rejection
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const updates = action === 'approve'
      ? { approval_status: 'approved', approved: true, approved_at: new Date(), approved_by: adminId }
      : { approval_status: 'rejected', approved: false, approved_at: new Date(), approved_by: adminId };

    const updated = await Property.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Send notification to owner
    try {
      const NotificationService = require('./services/notificationService');
      if (action === 'approve') {
        await NotificationService.notifyPropertyApproval(updated, adminId);
      } else {
        await NotificationService.notifyPropertyRejection(updated, adminId, reason);
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the approval if notification fails
    }

    return res.json({ success: true, message: 'Property updated', data: updated });
  } catch (error) {
    console.error('Admin approve/reject property error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Approve or reject a room (admin)
const approveRoomAdmin = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { action, reason } = req.body; // 'approve' | 'reject', optional reason for rejection
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const updates = action === 'approve'
      ? { approval_status: 'approved', approved: true, approved_at: new Date(), approved_by: adminId }
      : { approval_status: 'rejected', approved: false, approved_at: new Date(), approved_by: adminId };

    const updated = await Room.findByIdAndUpdate(roomId, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Find the property to send notification
    const property = await Property.findOne({ 'rooms._id': roomId });
    if (property) {
      try {
        const NotificationService = require('./services/notificationService');
        const room = property.rooms.id(roomId);
        if (action === 'approve') {
          await NotificationService.notifyRoomApproval(room, property, adminId);
        } else {
          await NotificationService.notifyRoomRejection(room, property, adminId, reason);
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the approval if notification fails
      }
    }

    res.json({ success: true, message: 'Room updated', data: updated });
  } catch (error) {
    console.error('Admin approve/reject room error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Send custom message from admin to owner
const sendAdminMessage = async (req, res) => {
  try {
    console.log('📨 sendAdminMessage called');
    console.log('Property ID:', req.params.id);
    console.log('Message:', req.body.message);
    
    const { id } = req.params; // property ID
    const { message } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      console.log('❌ No admin ID found');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    console.log('✅ Admin ID:', adminId);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message too long (max 500 characters)' });
    }

    // Find the property
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Fetch owner details from user service to get email
    let ownerEmail = null;
    let ownerName = 'Property Owner';
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
      const ownerResponse = await axios.get(`${userServiceUrl}/public/user/${property.owner_id}`);
      if (ownerResponse.data) {
        ownerEmail = ownerResponse.data.email;
        ownerName = ownerResponse.data.name || 'Property Owner';
      }
    } catch (err) {
      console.error('Error fetching owner details:', err.message);
    }

    // Send notification to owner
    try {
      const NotificationService = require('./services/notificationService');
      await NotificationService.sendAdminMessageToOwner(
        property.owner_id,
        property._id,
        property.property_name,
        message.trim(),
        adminId
      );
      console.log('✅ Notification created successfully');
    } catch (notifError) {
      console.error('Error sending admin message notification:', notifError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification',
        error: notifError.message 
      });
    }

    // Send email to owner using SendGrid
    if (ownerEmail && process.env.SENDGRID_API_KEY) {
      try {
        const emailMsg = {
          to: ownerEmail,
          from: process.env.SENDGRID_FROM_EMAIL || 'lyvo.company@gmail.com',
          subject: '📨 Important Message from Lyvo+ Admin',
          text: `Hello ${ownerName},

You have received an important message from the Lyvo+ Admin Team regarding your property "${property.property_name}".

Message:
${message.trim()}

Please log in to your dashboard to view more details and take any necessary action.

Best regards,
The Lyvo+ Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📨 Message from Admin</h1>
              </div>
              
              <div style="padding: 30px 20px; background-color: #ffffff;">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>${ownerName}</strong>,</p>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                  You have received an important message from the <strong>Lyvo+ Admin Team</strong> regarding your property:
                </p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px;">
                  <p style="font-size: 14px; color: #555; margin-bottom: 8px;"><strong>Property:</strong> ${property.property_name}</p>
                </div>
                
                <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffc107;">
                  <p style="font-size: 14px; color: #333; margin-bottom: 8px;"><strong>Admin Message:</strong></p>
                  <p style="font-size: 15px; color: #000; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message.trim()}</p>
                </div>
                
                <p style="font-size: 14px; color: #666; margin: 20px 0;">
                  Please log in to your dashboard to view more details and take any necessary action.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner-dashboard" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                    View Dashboard
                  </a>
                </div>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="font-size: 12px; color: #999; margin: 0;">
                  This is an automated message from <strong>Lyvo+</strong><br>
                  © ${new Date().getFullYear()} Lyvo. All rights reserved.
                </p>
              </div>
            </div>
          `
        };

        await sgMail.send(emailMsg);
        console.log(`✅ Email sent to owner: ${ownerEmail}`);
      } catch (emailError) {
        console.error('❌ Error sending email to owner:', emailError);
        // Don't fail the entire operation if email fails
      }
    } else {
      if (!ownerEmail) {
        console.log('⚠️ Owner email not found, skipping email notification');
      }
      if (!process.env.SENDGRID_API_KEY) {
        console.log('⚠️ SendGrid not configured, skipping email notification');
      }
    }

    return res.json({ 
      success: true, 
      message: 'Message sent to owner successfully (notification and email)'
    });
  } catch (error) {
    console.error('Send admin message error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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

    // Populate rooms data (only room mode supported)
    const propertyObj = property.toObject();
    const rooms = await Room.find({ property_id: property._id });
    propertyObj.rooms = rooms;

    res.json({ success: true, data: propertyObj });

  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Single Property for Admin
const getPropertyAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({ _id: id });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Populate rooms data
    const propertyObj = property.toObject();
    const rooms = await Room.find({ property_id: property._id });
    propertyObj.rooms = rooms;

    // Fetch owner details
    try {
      const resp = await fetch(`${process.env.USER_SERVICE_URL || 'http://localhost:4002/api'}/public/user/${property.owner_id}`, {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      if (resp.ok) {
        const u = await resp.json();
        propertyObj.owner = { id: property.owner_id, name: u.name || u.email || 'Unknown', email: u.email };
      } else {
        propertyObj.owner = { id: property.owner_id, name: 'Unknown', email: null };
      }
    } catch (e) {
      propertyObj.owner = { id: property.owner_id, name: 'Unknown', email: null };
    }

    res.json({ success: true, data: propertyObj });

  } catch (error) {
    console.error('Get property admin error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Approved Properties (Public - for seekers)
const getApprovedPropertiesPublic = async (req, res) => {
  try {
    const properties = await Property.find({ 
      approved: true,
      approval_status: 'approved',
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).select('property_name property_type description max_occupancy address latitude longitude pricing.monthly_rent amenities images owner_id createdAt');

    // Transform properties to include owner name and format for frontend
    const transformedProperties = await Promise.all(properties.map(async (property) => {
      try {
        // Get owner name from user service
        const ownerResponse = await fetch(`${process.env.USER_SERVICE_URL || 'http://localhost:4002/api'}/user/profile/${property.owner_id}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        let ownerName = 'Unknown Owner';
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json();
          ownerName = ownerData.name || ownerData.email || 'Unknown Owner';
        }

        return {
          _id: property._id,
          propertyName: property.property_name,
          propertyType: property.property_type,
          description: property.description,
          maxOccupancy: property.max_occupancy,
          address: property.address ? `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Address not available',
          latitude: property.latitude,
          longitude: property.longitude,
          rent: property.pricing?.monthly_rent,
          amenities: property.amenities || {},
          images: property.images?.images || [],
          ownerName: ownerName,
          createdAt: property.createdAt
        };
      } catch (error) {
        console.error('Error fetching owner for property:', property._id, error);
        return {
          _id: property._id,
          propertyName: property.property_name,
          propertyType: property.property_type,
          description: property.description,
          maxOccupancy: property.max_occupancy,
          address: property.address ? `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Address not available',
          latitude: property.latitude,
          longitude: property.longitude,
          rent: property.pricing?.monthly_rent,
          amenities: property.amenities || {},
          images: property.images?.images || [],
          ownerName: 'Unknown Owner',
          createdAt: property.createdAt
        };
      }
    }));

    res.json({
      success: true,
      properties: transformedProperties
    });

  } catch (error) {
    console.error('Get approved properties public error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Single Approved Property (Public - for seekers)
const getApprovedPropertyPublic = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({ 
      _id: id,
      approved: true,
      approval_status: 'approved'
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found or not approved' });
    }

    // Get owner name from user service
    let ownerName = 'Unknown Owner';
    try {
      const ownerResponse = await fetch(`${process.env.USER_SERVICE_URL || 'http://localhost:4002/api'}/user/profile/${property.owner_id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json();
        ownerName = ownerData.name || ownerData.email || 'Unknown Owner';
      }
    } catch (error) {
      console.error('Error fetching owner for property:', property._id, error);
    }

    // Fetch approved rooms for this property
    let rooms = [];
    try {
      const roomDocs = await Room.find({ property_id: property._id, approval_status: 'approved' });
      rooms = roomDocs.map(r => ({
        _id: r._id,
        roomNumber: r.room_number,
        roomType: r.room_type,
        roomSize: r.room_size,
        bedType: r.bed_type,
        occupancy: r.occupancy,
        rent: r.rent,
        amenities: r.amenities || {},
        description: r.description || '',
        roomImage: r.room_image || null,
        toiletImage: r.toilet_image || null,
        isAvailable: r.is_available,
        status: r.status,
        approvalStatus: r.approval_status
      }));
    } catch (_) {
      rooms = [];
    }

    // Transform property for frontend
    const transformedProperty = {
      _id: property._id,
      propertyName: property.property_name,
      propertyType: property.property_type,
      description: property.description,
      maxOccupancy: property.max_occupancy,
      address: property.address ? `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Address not available',
      latitude: property.latitude,
      longitude: property.longitude,
      rent: property.pricing?.monthly_rent,
      securityDeposit: property.pricing?.security_deposit,
      maintenanceCharges: property.pricing?.maintenance_charges,
      utilityCharges: property.pricing?.utility_charges,
      amenities: property.amenities || {},
      rules: property.rules || {},
      images: property.images || {},
      documents: property.documents || [],
      ownerName: ownerName,
      createdAt: property.createdAt,
      rooms
    };

    res.json({ success: true, property: transformedProperty });

  } catch (error) {
    console.error('Get approved property public error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update room status
const updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    console.log('=== UPDATE ROOM STATUS ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    console.log('User ID:', userId);
    console.log('Room ID:', roomId);
    console.log('Status:', status);

    // Validate status
    const validStatuses = ['active', 'inactive', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, maintenance'
      });
    }

    // Find and update the room
    const room = await Room.findOneAndUpdate(
      { 
        _id: roomId,
        property_id: { $exists: true } // Ensure it's linked to a property
      },
      { 
        status: status,
        updated_at: new Date()
      },
      { new: true }
    ).populate('property_id', 'owner_id');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify the property belongs to the user
    if (room.property_id.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this room'
      });
    }

    console.log('Room status updated successfully:', room);

    res.json({
      success: true,
      message: 'Room status updated successfully',
      data: {
        room_id: room._id,
        status: room.status,
        updated_at: room.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating room status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room status',
      error: error.message
    });
  }
};

// Update room details
const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    console.log('=== UPDATE ROOM ===');
    console.log('Room ID:', roomId);
    console.log('User ID:', userId);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Parse room data
    let roomData;
    try {
      roomData = JSON.parse(req.body.roomData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room data format'
      });
    }

    // Find the room and verify ownership
    const room = await Room.findOne({ _id: roomId }).populate('property_id', 'owner_id');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify the property belongs to the user
    if (room.property_id.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this room'
      });
    }

    // Handle image uploads
    let imageUrls = {};
    
    if (req.files) {
      // Handle room image upload
      if (req.files.room_image && req.files.room_image[0]) {
        try {
          const uploadResult = await uploadImage(req.files.room_image[0]);
          if (uploadResult.success) {
            imageUrls.room_image = uploadResult.url;
            console.log('Room image uploaded:', uploadResult.url);
          }
        } catch (error) {
          console.error('Error uploading room image:', error);
        }
      }

      // Handle toilet image upload
      if (req.files.toilet_image && req.files.toilet_image[0]) {
        try {
          const uploadResult = await uploadImage(req.files.toilet_image[0]);
          if (uploadResult.success) {
            imageUrls.toilet_image = uploadResult.url;
            console.log('Toilet image uploaded:', uploadResult.url);
          }
        } catch (error) {
          console.error('Error uploading toilet image:', error);
        }
      }
    }

    // Update room data
    const updateData = {
      ...roomData,
      ...imageUrls,
      updated_at: new Date()
    };

    // Auto-set occupancy based on room type
    const occupancyMap = {
      'Single': 1,
      'Double': 2,
      'Triple': 3,
      'Quad': 4,
      'Master': 2,
      'Studio': 1
    };
    if (roomData.room_type) {
      updateData.occupancy = occupancyMap[roomData.room_type] || 1;
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      updateData,
      { new: true }
    );

    console.log('Room updated successfully:', updatedRoom);

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom
    });

  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
};

// Get Single Room (Public - for seekers)
const getRoomPublic = async (req, res) => {
  try {
    const { roomId } = req.params;

    console.log('=== GET ROOM PUBLIC ===');
    console.log('Room ID:', roomId);
    console.log('Room ID type:', typeof roomId);
    console.log('Room ID length:', roomId.length);

    // Validate roomId format
    if (!roomId || roomId.length !== 24) {
      console.log('Invalid room ID format');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid room ID format' 
      });
    }

    // Find the room (check if it exists first)
    const room = await Room.findOne({ _id: roomId });

    if (!room) {
      console.log('Room not found in database');
      console.log('Searching for room with ID:', roomId);
      
      // Let's also check if there are any rooms in the database
      const allRooms = await Room.find({}).limit(5);
      console.log('Sample rooms in database:', allRooms.map(r => ({ id: r._id, room_number: r.room_number })));
      
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found in database' 
      });
    }

    console.log('Room found:', {
      id: room._id,
      approval_status: room.approval_status,
      approved: room.approved,
      room_number: room.room_number,
      property_id: room.property_id
    });

    // Find the associated property
    const property = await Property.findOne({ _id: room.property_id });

    if (!property) {
      console.log('Property not found for room:', room.property_id);
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }

    console.log('Property found:', {
      id: property._id,
      property_name: property.property_name,
      approved: property.approved,
      approval_status: property.approval_status
    });

    // Get owner information
    let owner = null;
    try {
      const ownerResponse = await fetch(`${process.env.USER_SERVICE_URL || 'http://localhost:4002/api'}/user/profile/${property.owner_id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json();
        owner = {
          id: property.owner_id,
          name: ownerData.name || ownerData.email || 'Unknown Owner',
          email: ownerData.email,
          phone: ownerData.phone,
          profilePicture: ownerData.profilePicture
        };
      }
    } catch (error) {
      console.error('Error fetching owner for room:', roomId, error);
      owner = {
        id: property.owner_id,
        name: 'Unknown Owner',
        email: null,
        phone: null,
        profilePicture: null
      };
    }

    // Transform room data for frontend
    const transformedRoom = {
      _id: room._id,
      roomNumber: room.room_number,
      roomType: room.room_type,
      roomSize: room.room_size,
      bedType: room.bed_type,
      occupancy: room.occupancy,
      rent: room.rent,
      amenities: room.amenities || {},
      description: room.description || '',
      roomImage: room.room_image || null,
      toiletImage: room.toilet_image || null,
      isAvailable: room.is_available,
      status: room.status,
      approvalStatus: room.approval_status
    };

    // Transform property data for frontend
    const transformedProperty = {
      _id: property._id,
      property_name: property.property_name,
      description: property.description,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      security_deposit: property.security_deposit,
      amenities: property.amenities || {},
      images: property.images || {}
    };

    res.json({ 
      success: true, 
      data: {
        room: transformedRoom,
        property: transformedProperty,
        owner: owner
      }
    });

  } catch (error) {
    console.error('Get room public error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get all rooms (for debugging)
const getAllRoomsDebug = async (req, res) => {
  try {
    console.log('=== GET ALL ROOMS DEBUG ===');
    
    const rooms = await Room.find({}).limit(10);
    console.log('Found rooms:', rooms.length);
    
    const roomsData = rooms.map(room => ({
      _id: room._id,
      room_number: room.room_number,
      room_type: room.room_type,
      property_id: room.property_id,
      approval_status: room.approval_status,
      approved: room.approved
    }));
    
    res.json({
      success: true,
      message: 'Rooms retrieved for debugging',
      count: rooms.length,
      rooms: roomsData
    });
  } catch (error) {
    console.error('Get all rooms debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving rooms',
      error: error.message
    });
  }
};

// Create Razorpay Order for Booking Payment
const createPaymentOrder = async (req, res) => {
  try {
    const { userId, roomId, propertyId } = req.body;
    
    if (!userId || !roomId || !propertyId) {
      return res.status(400).json({ success: false, message: 'userId, roomId and propertyId are required' });
    }

    // Fetch room and property details
    const room = await Room.findOne({ _id: roomId });
    const property = await Property.findOne({ _id: propertyId });
    
    if (!room || !property) {
      return res.status(404).json({ success: false, message: 'Room or Property not found' });
    }

    // Calculate payment amounts
    const monthlyRent = room.rent;
    const securityDeposit = property.security_deposit;
    const totalAmount = monthlyRent + securityDeposit;
    const advancePayment = totalAmount * 0.1; // 10% advance to be paid online
    const remainingPayment = totalAmount * 0.9; // 90% to be paid offline at check-in

    // Create Razorpay order for 10% advance payment only
    const orderOptions = {
      amount: Math.round(advancePayment * 100), // Razorpay expects amount in paise (10% of total)
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: {
        userId,
        roomId,
        propertyId,
        monthlyRent,
        securityDeposit,
        totalAmount,
        advancePayment,
        remainingPayment,
        roomType: room.room_type,
        propertyName: property.property_name
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      message: 'Payment order created for 10% advance',
      order: {
        id: order.id,
        amount: order.amount, // This is now 10% of total in paise
        currency: order.currency,
        receipt: order.receipt
      },
      paymentDetails: {
        totalAmount,
        advancePayment,
        remainingPayment,
        monthlyRent,
        securityDeposit,
        roomDetails: {
          roomNumber: room.room_number,
          roomType: room.room_type,
          rent: room.rent
        },
        propertyDetails: {
          name: property.property_name,
          address: property.address
        }
      }
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// Verify Payment and Create Booking
const verifyPaymentAndCreateBooking = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      roomId,
      propertyId,
      monthlyRent,
      securityDeposit
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification details missing' });
    }

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '9qxxugjEleGtcqcOjWFmCB2n')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Fetch room and property details
    const room = await Room.findOne({ _id: roomId });
    const property = await Property.findOne({ _id: propertyId });
    
    if (!room || !property) {
      return res.status(404).json({ success: false, message: 'Room or Property not found' });
    }

    // Fetch user and owner snapshots
    let userSnapshot = {};
    let ownerSnapshot = {};
    try {
      const userSvc = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
      const [userResp, ownerResp] = await Promise.all([
        fetch(`${userSvc}/public/user/${userId}`),
        fetch(`${userSvc}/public/user/${property.owner_id}`)
      ]);
      if (userResp?.ok) {
        const u = await userResp.json();
        userSnapshot = { name: u.name || u.email, email: u.email, phone: u.phone };
      }
      if (ownerResp?.ok) {
        const o = await ownerResp.json();
        ownerSnapshot = { name: o.name || o.email, email: o.email, phone: o.phone };
      }
    } catch (e) {
      console.warn('Booking snapshot fetch warning:', e?.message);
    }

    // Create booking with payment details
    const booking = await Booking.create({
      userId,
      ownerId: String(property.owner_id),
      propertyId: property._id,
      roomId: room._id,
      status: 'pending_approval',
      payment: {
        totalAmount: monthlyRent + securityDeposit,
        securityDeposit,
        monthlyRent,
        currency: 'INR',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: 'completed',
        paymentMethod: 'razorpay',
        paidAt: new Date()
      },
      userSnapshot,
      ownerSnapshot,
      propertySnapshot: {
        name: property.property_name,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        security_deposit: property.security_deposit,
      },
      roomSnapshot: {
        roomNumber: room.room_number,
        roomType: room.room_type,
        roomSize: room.room_size,
        bedType: room.bed_type,
        occupancy: room.occupancy,
        rent: room.rent,
        amenities: room.amenities,
        images: { room: room.room_image, toilet: room.toilet_image }
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Payment verified and booking created. Waiting for owner approval.',
      booking,
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: monthlyRent + securityDeposit,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Verify payment and create booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment and create booking' });
  }
};

// Create Booking (Public - seeker books a room)
const createBookingPublic = async (req, res) => {
  try {
    const { userId, roomId, propertyId } = req.body || {};
    if (!userId || !roomId || !propertyId) {
      return res.status(400).json({ success: false, message: 'userId, roomId and propertyId are required' });
    }

    // Fetch room and property
    const room = await Room.findOne({ _id: roomId });
    const property = await Property.findOne({ _id: propertyId });
    if (!room || !property) {
      return res.status(404).json({ success: false, message: 'Room or Property not found' });
    }

    // Check if room is inactive
    if (room.status === 'inactive') {
      return res.status(400).json({ 
        success: false, 
        message: 'This room is currently inactive and not available for booking' 
      });
    }

    // Check if room is under maintenance
    if (room.status === 'maintenance') {
      return res.status(400).json({ 
        success: false, 
        message: 'This room is under maintenance and not available for booking' 
      });
    }

    // Check if room is available
    if (!room.is_available) {
      return res.status(400).json({ 
        success: false, 
        message: 'This room is not available for booking' 
      });
    }

    // Fetch user and owner (best-effort)
    let userSnapshot = {};
    let ownerSnapshot = {};
    try {
      const userSvc = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
      const [userResp, ownerResp] = await Promise.all([
        fetch(`${userSvc}/public/user/${userId}`),
        fetch(`${userSvc}/public/user/${property.owner_id}`)
      ]);
      if (userResp?.ok) {
        const u = await userResp.json();
        userSnapshot = { name: u.name || u.email, email: u.email, phone: u.phone };
      }
      if (ownerResp?.ok) {
        const o = await ownerResp.json();
        ownerSnapshot = { name: o.name || o.email, email: o.email, phone: o.phone };
      }
    } catch (e) {
      console.warn('Booking snapshot fetch warning:', e?.message);
    }

    // Calculate payment amounts
    const monthlyRent = room.rent;
    const securityDeposit = property.security_deposit;
    const totalAmount = monthlyRent + securityDeposit;

    const booking = await Booking.create({
      userId,
      ownerId: String(property.owner_id),
      propertyId: property._id,
      roomId: room._id,
      status: 'payment_pending',
      payment: {
        totalAmount,
        securityDeposit,
        monthlyRent,
        currency: 'INR',
        razorpayOrderId: null,
        razorpayPaymentId: null,
        razorpaySignature: null,
        paymentStatus: 'pending',
        paymentMethod: 'razorpay',
        paidAt: null
      },
      userSnapshot,
      ownerSnapshot,
      propertySnapshot: {
        name: property.property_name,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        security_deposit: property.security_deposit,
      },
      roomSnapshot: {
        roomNumber: room.room_number,
        roomType: room.room_type,
        roomSize: room.room_size,
        bedType: room.bed_type,
        occupancy: room.occupancy,
        rent: room.rent,
        amenities: room.amenities,
        images: { room: room.room_image, toilet: room.toilet_image }
      }
    });

    return res.status(201).json({ success: true, message: 'Booking created', booking });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List Bookings for Owner (Protected)
const listOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const bookings = await Booking.find({ ownerId: String(ownerId) }).sort({ createdAt: -1 });
    return res.json({ success: true, bookings });
  } catch (error) {
    console.error('List owner bookings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Bookings Pending Approval for Owner (Protected)
const getPendingApprovalBookings = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const pendingBookings = await Booking.find({ 
      ownerId: String(ownerId), 
      status: 'pending_approval' 
    }).sort({ createdAt: -1 });
    
    return res.json({ 
      success: true, 
      bookings: pendingBookings,
      count: pendingBookings.length,
      message: `Found ${pendingBookings.length} bookings pending approval`
    });
  } catch (error) {
    console.error('Get pending approval bookings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Check if user has pending booking for a specific room (Public)
const checkUserBookingStatus = async (req, res) => {
  try {
    const { userId, roomId } = req.query;
    
    if (!userId || !roomId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and roomId are required' 
      });
    }

    // Check for any existing booking for this user and room
    const existingBooking = await Booking.findOne({
      userId: String(userId),
      roomId: roomId,
      status: { $in: ['pending_approval', 'confirmed', 'payment_pending'] }
    }).sort({ createdAt: -1 });

    if (existingBooking) {
      return res.json({
        success: true,
        hasBooking: true,
        booking: existingBooking,
        status: existingBooking.status,
        message: `User has a ${existingBooking.status} booking for this room`
      });
    }

    return res.json({
      success: true,
      hasBooking: false,
      message: 'No existing booking found for this user and room'
    });

  } catch (error) {
    console.error('Check user booking status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user bookings with room and property details (Public)
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    // Get all bookings for the user with populated room and property details
    const bookings = await Booking.find({ userId: String(userId) })
      .populate('roomId', 'roomNumber rent amenities room_image toilet_image isAvailable roomType room_type bed_type occupancy room_size description')
      .populate('propertyId', 'propertyName address latitude longitude images amenities propertyType ownerName property_name description owner_id')
      .sort({ createdAt: -1 });

    // Fetch owner details for all unique owner IDs
    const ownerIds = [...new Set(bookings.map(b => b.propertyId?.owner_id).filter(Boolean))];
    const ownerDetailsMap = {};
    
    // Fetch owner details from user service
    if (ownerIds.length > 0) {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
      for (const ownerId of ownerIds) {
        try {
          const url = `${userServiceUrl}/public/user/${ownerId}`;
          console.log(`Fetching owner details from: ${url}`);
          const ownerResponse = await axios.get(url);
          
          if (ownerResponse.data) {
            // The API returns user data directly, not wrapped in { user: ... }
            const userData = ownerResponse.data;
            ownerDetailsMap[ownerId] = {
              name: userData.name || 'Owner',
              email: userData.email || '',
              phone: userData.phone || userData.phoneNumber || ''
            };
            console.log(`Successfully fetched owner ${ownerId}:`, ownerDetailsMap[ownerId]);
          }
        } catch (error) {
          console.error(`Error fetching owner ${ownerId}:`, error.response?.status, error.response?.data || error.message);
          // Even if fetch fails, add a placeholder to avoid undefined errors
          ownerDetailsMap[ownerId] = {
            name: 'Owner',
            email: '',
            phone: ''
          };
        }
      }
    }

    // Transform the data to include room and property details
    const bookingsWithDetails = bookings.map(booking => ({
      _id: booking._id,
      userId: booking.userId,
      roomId: booking.roomId,
      propertyId: booking.propertyId,
      ownerId: booking.ownerId,
      status: booking.status,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      totalAmount: booking.totalAmount,
      securityDeposit: booking.securityDeposit,
      monthlyRent: booking.monthlyRent,
      payment: booking.payment,
      approvedAt: booking.approvedAt,
      approvedBy: booking.approvedBy,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      // Room details
      room: booking.roomId ? {
        _id: booking.roomId._id,
        roomNumber: booking.roomId.roomNumber || booking.roomId.room_number,
        rent: booking.roomId.rent,
        amenities: booking.roomId.amenities,
        images: booking.roomId.room_image ? [booking.roomId.room_image] : [],
        roomImage: booking.roomId.room_image,
        toiletImage: booking.roomId.toilet_image,
        isAvailable: booking.roomId.isAvailable || booking.roomId.is_available,
        roomType: booking.roomId.roomType || booking.roomId.room_type,
        bedType: booking.roomId.bed_type,
        occupancy: booking.roomId.occupancy,
        roomSize: booking.roomId.room_size,
        description: booking.roomId.description
      } : null,
      // Property details
      property: booking.propertyId ? {
        _id: booking.propertyId._id,
        propertyName: booking.propertyId.propertyName || booking.propertyId.property_name,
        address: booking.propertyId.address,
        latitude: booking.propertyId.latitude,
        longitude: booking.propertyId.longitude,
        images: booking.propertyId.images || [],
        amenities: booking.propertyId.amenities,
        propertyType: booking.propertyId.propertyType,
        ownerName: ownerDetailsMap[booking.propertyId.owner_id]?.name || booking.propertyId.ownerName,
        ownerEmail: ownerDetailsMap[booking.propertyId.owner_id]?.email,
        ownerPhone: ownerDetailsMap[booking.propertyId.owner_id]?.phone,
        description: booking.propertyId.description
      } : null
    }));

    return res.json({
      success: true,
      bookings: bookingsWithDetails,
      count: bookingsWithDetails.length,
      message: `Found ${bookingsWithDetails.length} bookings for user`
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== FAVORITES API ====================

// Add property/room to favorites (Public)
const addToFavorites = async (req, res) => {
  try {
    const { userId, propertyId, roomId, notes, tags } = req.body;
    
    if (!userId || !propertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and propertyId are required' 
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: String(userId),
      propertyId: propertyId,
      roomId: roomId || null
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Already added to favorites'
      });
    }

    // Create new favorite
    const favorite = new Favorite({
      userId: String(userId),
      propertyId: propertyId,
      roomId: roomId || null,
      notes: notes || '',
      tags: tags || []
    });

    await favorite.save();

    return res.json({
      success: true,
      message: 'Added to favorites successfully',
      favorite: favorite
    });

  } catch (error) {
    console.error('Add to favorites error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Remove property/room from favorites (Public)
const removeFromFavorites = async (req, res) => {
  try {
    const { userId, propertyId, roomId } = req.body;
    
    if (!userId || !propertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and propertyId are required' 
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      userId: String(userId),
      propertyId: propertyId,
      roomId: roomId || null
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    return res.json({
      success: true,
      message: 'Removed from favorites successfully'
    });

  } catch (error) {
    console.error('Remove from favorites error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user favorites with property and room details (Public)
const getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    // Get all favorites for the user with populated property and room details
    const favorites = await Favorite.find({ userId: String(userId) })
      .populate('propertyId', 'propertyName address latitude longitude images amenities propertyType ownerName property_name description owner_id')
      .populate('roomId', 'roomNumber rent amenities room_image toilet_image isAvailable roomType room_type bed_type occupancy room_size description')
      .sort({ addedAt: -1 });

    // Fetch owner details for all unique owner IDs
    const ownerIds = [...new Set(favorites.map(f => f.propertyId?.owner_id).filter(Boolean))];
    const ownerDetailsMap = {};
    
    // Fetch owner details from user service
    if (ownerIds.length > 0) {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
      for (const ownerId of ownerIds) {
        try {
          const url = `${userServiceUrl}/public/user/${ownerId}`;
          console.log(`Fetching owner details from: ${url}`);
          const ownerResponse = await axios.get(url);
          
          if (ownerResponse.data) {
            // The API returns user data directly, not wrapped in { user: ... }
            const userData = ownerResponse.data;
            ownerDetailsMap[ownerId] = {
              name: userData.name || 'Owner',
              email: userData.email || '',
              phone: userData.phone || userData.phoneNumber || ''
            };
            console.log(`Successfully fetched owner ${ownerId}:`, ownerDetailsMap[ownerId]);
          }
        } catch (error) {
          console.error(`Error fetching owner ${ownerId}:`, error.response?.status, error.response?.data || error.message);
          // Even if fetch fails, add a placeholder to avoid undefined errors
          ownerDetailsMap[ownerId] = {
            name: 'Owner',
            email: '',
            phone: ''
          };
        }
      }
    }

    // Transform the data to include property and room details
    const favoritesWithDetails = favorites.map(favorite => ({
      _id: favorite._id,
      userId: favorite.userId,
      propertyId: favorite.propertyId,
      roomId: favorite.roomId,
      addedAt: favorite.addedAt,
      notes: favorite.notes,
      tags: favorite.tags,
      // Property details
      property: favorite.propertyId ? {
        _id: favorite.propertyId._id,
        propertyName: favorite.propertyId.propertyName || favorite.propertyId.property_name,
        address: favorite.propertyId.address,
        latitude: favorite.propertyId.latitude,
        longitude: favorite.propertyId.longitude,
        images: favorite.propertyId.images || [],
        amenities: favorite.propertyId.amenities,
        propertyType: favorite.propertyId.propertyType,
        ownerName: ownerDetailsMap[favorite.propertyId.owner_id]?.name || favorite.propertyId.ownerName,
        ownerEmail: ownerDetailsMap[favorite.propertyId.owner_id]?.email,
        ownerPhone: ownerDetailsMap[favorite.propertyId.owner_id]?.phone,
        description: favorite.propertyId.description
      } : null,
      // Room details (if favoriting specific room)
      room: favorite.roomId ? {
        _id: favorite.roomId._id,
        roomNumber: favorite.roomId.roomNumber || favorite.roomId.room_number,
        rent: favorite.roomId.rent,
        amenities: favorite.roomId.amenities,
        images: favorite.roomId.room_image ? [favorite.roomId.room_image] : [],
        roomImage: favorite.roomId.room_image,
        toiletImage: favorite.roomId.toilet_image,
        isAvailable: favorite.roomId.isAvailable || favorite.roomId.is_available,
        roomType: favorite.roomId.roomType || favorite.roomId.room_type,
        bedType: favorite.roomId.bed_type,
        occupancy: favorite.roomId.occupancy,
        roomSize: favorite.roomId.room_size,
        description: favorite.roomId.description
      } : null
    }));

    return res.json({
      success: true,
      favorites: favoritesWithDetails,
      count: favoritesWithDetails.length,
      message: `Found ${favoritesWithDetails.length} favorites for user`
    });

  } catch (error) {
    console.error('Get user favorites error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Check if property/room is favorited (Public)
const checkFavoriteStatus = async (req, res) => {
  try {
    const { userId, propertyId, roomId } = req.query;
    
    if (!userId || !propertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and propertyId are required' 
      });
    }

    const favorite = await Favorite.findOne({
      userId: String(userId),
      propertyId: propertyId,
      roomId: roomId || null
    });

    return res.json({
      success: true,
      isFavorited: !!favorite,
      favorite: favorite
    });

  } catch (error) {
    console.error('Check favorite status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get single booking (Protected) - owner or seeker can view their own booking
const getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    if (!bookingId || bookingId.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Best-effort enrichment of snapshots (in case older records lack them)
    let userSnapshot = booking.userSnapshot || {};
    let ownerSnapshot = booking.ownerSnapshot || {};
    const userSvc = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
    try {
      const [uResp, oResp] = await Promise.all([
        userSnapshot?.email ? Promise.resolve({ ok: false }) : fetch(`${userSvc}/public/user/${booking.userId}`),
        ownerSnapshot?.email ? Promise.resolve({ ok: false }) : fetch(`${userSvc}/public/user/${booking.ownerId}`)
      ]);
      if (uResp?.ok) {
        const u = await uResp.json();
        userSnapshot = { name: u.name || u.email, email: u.email, phone: u.phone };
      }
      if (oResp?.ok) {
        const o = await oResp.json();
        ownerSnapshot = { name: o.name || o.email, email: o.email, phone: o.phone };
      }
    } catch (_) {}

    const enriched = {
      ...booking.toObject(),
      userSnapshot,
      ownerSnapshot
    };

    const requesterId = req.user?.id;
    if (requesterId && (String(booking.ownerId) === String(requesterId) || String(booking.userId) === String(requesterId))) {
      return res.json({ success: true, booking: enriched, source: 'booking' });
    }

    // If no auth or not authorized
    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    console.error('Get booking details error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update booking status (owner only)
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body; // 'approve' | 'reject'
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!bookingId || bookingId.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }
    if (!['approve', 'reject'].includes(String(action))) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (String(booking.ownerId) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Only allow approval/rejection for bookings that are pending approval
    if (booking.status !== 'pending_approval') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot ${action} booking with status: ${booking.status}` 
      });
    }

    const newStatus = action === 'approve' ? 'confirmed' : 'rejected';
    booking.status = newStatus;
    
    // Add approval timestamp and owner info
    booking.approvedAt = new Date();
    booking.approvedBy = ownerId;
    
    await booking.save();

    // Fetch property and room for notifications
    const property = await Property.findById(booking.propertyId);
    const room = await Room.findById(booking.roomId);

    // Send notification to seeker
    try {
      const NotificationService = require('./services/notificationService');
      const reason = req.body.reason || null; // Optional rejection reason
      
      if (action === 'approve') {
        await NotificationService.notifyBookingApproval(booking, property, room, ownerId);
      } else {
        await NotificationService.notifyBookingRejection(booking, property, room, ownerId, reason);
      }
    } catch (notifError) {
      console.error('Error sending booking notification:', notifError);
      // Don't fail the approval/rejection if notification fails
    }

    // If booking is approved, create a tenant record
    let tenant = null;
    if (action === 'approve') {
      try {
        // Check if tenant record already exists for this booking
        const existingTenant = await Tenant.findOne({ bookingId: booking._id });
        
        if (!existingTenant) {
          console.log(`Creating tenant for booking ${booking._id}`);
          console.log('Booking data:', {
            userId: booking.userId,
            userSnapshot: booking.userSnapshot,
            propertyId: booking.propertyId,
            roomId: booking.roomId,
            payment: booking.payment
          });
          
          // Property and room already fetched above for notifications
          console.log('Property found:', !!property);
          console.log('Room found:', !!room);
          
          // Fetch owner details from user service
          let ownerDetails = {
            name: booking.ownerName || 'Owner',
            email: '',
            phone: ''
          };
          
          try {
            const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
            const ownerResponse = await axios.get(`${userServiceUrl}/public/user/${ownerId}`);
            if (ownerResponse.data) {
              ownerDetails = {
                name: ownerResponse.data.name || 'Owner',
                email: ownerResponse.data.email || '',
                phone: ownerResponse.data.phone || ownerResponse.data.phoneNumber || ''
              };
            }
          } catch (err) {
            console.error('Error fetching owner details for tenant:', err.message);
          }
          
          // Create tenant record
          tenant = new Tenant({
            // User/Tenant Information
            userId: booking.userId,
            userName: booking.userSnapshot?.name || 'User',
            userEmail: booking.userSnapshot?.email || '',
            userPhone: booking.userSnapshot?.phone || '',
            
            // Property and Room Information
            propertyId: booking.propertyId,
            propertyName: property?.property_name || booking.propertySnapshot?.name || 'Property',
            roomId: booking.roomId,
            roomNumber: room?.room_number?.toString() || booking.roomSnapshot?.roomNumber?.toString() || 'N/A',
            
            // Owner Information
            ownerId: booking.ownerId,
            ownerName: ownerDetails.name,
            ownerEmail: ownerDetails.email,
            ownerPhone: ownerDetails.phone,
            
            // Booking Reference
            bookingId: booking._id,
            
            // Payment Information
            paymentId: booking.payment?.razorpayPaymentId,
            razorpayOrderId: booking.payment?.razorpayOrderId,
            razorpayPaymentId: booking.payment?.razorpayPaymentId,
            amountPaid: booking.payment?.totalAmount || 0,
            
            // Tenancy Dates
            checkInDate: new Date(), // Set to current date when approved
            checkOutDate: null, // Can be set later by owner
            
            // Tenancy Details
            monthlyRent: booking.payment?.monthlyRent || room?.rent || 0,
            securityDeposit: booking.payment?.securityDeposit || 0,
            
            // Status
            status: 'active',
            
            // Metadata
            confirmedBy: ownerId,
            confirmedAt: new Date(),
            
            // Additional notes
            specialRequests: '',
          });
          
          await tenant.save();
          console.log(`Tenant record created for booking ${booking._id}`);
        } else {
          tenant = existingTenant;
          console.log(`Tenant record already exists for booking ${booking._id}`);
        }
      } catch (tenantError) {
        console.error('Error creating tenant record:', tenantError);
        console.error('Tenant error stack:', tenantError.stack);
        console.error('Booking data:', JSON.stringify(booking, null, 2));
        // Don't fail the approval if tenant creation fails
      }
    }

    const message = action === 'approve' 
      ? 'Booking approved successfully and tenant record created' 
      : 'Booking rejected';

    return res.json({ 
      success: true, 
      message, 
      booking,
      tenant: tenant || undefined,
      status: newStatus
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DEBUG: list recent bookings
const getAllBookingsDebug = async (req, res) => {
  try {
    const items = await Booking.find({}).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, count: items.length, bookings: items });
  } catch (error) {
    console.error('Debug list bookings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Cancel and delete booking (user only - for pending/confirmed bookings)
const cancelAndDeleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!bookingId || bookingId.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify the booking belongs to the user
    if (String(booking.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
    }

    // Only allow cancellation of pending or confirmed bookings
    if (!['pending', 'pending_approval', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel booking with status: ${booking.status}` 
      });
    }

    // For confirmed bookings, check if check-in is more than 24 hours away
    if (booking.status === 'confirmed' && booking.checkInDate) {
      const checkInDate = new Date(booking.checkInDate);
      const now = new Date();
      const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
      
      if (hoursUntilCheckIn <= 24) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel confirmed booking within 24 hours of check-in. Please contact support.'
        });
      }
    }

    // Delete any associated tenant record
    await Tenant.deleteOne({ bookingId: booking._id });

    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);

    // Make room available again
    if (booking.roomId) {
      await Room.findByIdAndUpdate(booking.roomId, { is_available: true });
    }

    // Send notification to owner
    try {
      const NotificationService = require('./services/notificationService');
      const property = await Property.findById(booking.propertyId);
      const room = await Room.findById(booking.roomId);
      
      await NotificationService.createNotification({
        recipient_id: booking.ownerId,
        recipient_type: 'owner',
        title: 'Booking Cancelled',
        message: `${booking.userSnapshot?.name || 'A user'} has cancelled their booking for ${property?.property_name || 'your property'}${room?.room_number ? ` - Room ${room.room_number}` : ''}`,
        type: 'booking',
        related_property_id: booking.propertyId,
        related_room_id: booking.roomId,
        related_booking_id: booking._id,
        metadata: {
          cancelledBy: 'user',
          cancelledAt: new Date(),
          bookingStatus: booking.status
        }
      });
    } catch (notifError) {
      console.error('Error sending cancellation notification:', notifError);
    }

    return res.json({ 
      success: true, 
      message: 'Booking cancelled and removed successfully',
      deletedBookingId: bookingId
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Lookup booking by composite IDs or compose details if not found
const lookupBookingDetails = async (req, res) => {
  try {
    const { userId, ownerId, propertyId, roomId } = req.query;
    if (!userId || !ownerId || !propertyId || !roomId) {
      return res.status(400).json({ success: false, message: 'userId, ownerId, propertyId and roomId are required' });
    }

    // 1) Try to find an existing booking
    const existing = await Booking.findOne({ userId: String(userId), ownerId: String(ownerId), propertyId, roomId }).sort({ createdAt: -1 });
    if (existing) {
      return res.json({ success: true, booking: existing, source: 'booking' });
    }

    // 2) Compose details from referenced entities
    const [room, property] = await Promise.all([
      Room.findOne({ _id: roomId }),
      Property.findOne({ _id: propertyId }),
    ]);
    if (!room || !property) {
      return res.status(404).json({ success: false, message: 'Room or Property not found' });
    }

    // Fetch user and owner snapshots best-effort
    let userSnapshot = {};
    let ownerSnapshot = {};
    try {
      const userSvc = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
      const [userResp, ownerResp] = await Promise.all([
        fetch(`${userSvc}/user/profile/${userId}`),
        fetch(`${userSvc}/user/profile/${ownerId}`)
      ]);
      if (userResp?.ok) {
        const u = await userResp.json();
        userSnapshot = { name: u.name || u.email, email: u.email, phone: u.phone };
      }
      if (ownerResp?.ok) {
        const o = await ownerResp.json();
        ownerSnapshot = { name: o.name || o.email, email: o.email, phone: o.phone };
      }
    } catch (e) {
      // ignore snapshot errors
    }

    const composed = {
      userId: String(userId),
      ownerId: String(ownerId),
      propertyId: property._id,
      roomId: room._id,
      status: 'pending',
      userSnapshot,
      ownerSnapshot,
      propertySnapshot: {
        name: property.property_name,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        security_deposit: property.security_deposit,
      },
      roomSnapshot: {
        roomNumber: room.room_number,
        roomType: room.room_type,
        roomSize: room.room_size,
        bedType: room.bed_type,
        occupancy: room.occupancy,
        rent: room.rent,
        amenities: room.amenities,
        images: { room: room.room_image, toilet: room.toilet_image }
      }
    };

    return res.json({ success: true, booking: composed, source: 'composed' });
  } catch (error) {
    console.error('Lookup booking details error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update property details
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    console.log('=== UPDATE PROPERTY ===');
    console.log('Property ID:', id);
    console.log('User ID:', userId);
    console.log('Update Data:', updateData);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Access token or user id required'
      });
    }

    // Find the property and verify ownership
    const property = await Property.findOne({ _id: id, owner_id: userId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have permission to update it'
      });
    }

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );

    console.log('Property updated successfully:', updatedProperty._id);

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });

  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ==================== TENANT MANAGEMENT ====================

// DEBUG: Create tenant records for all confirmed bookings that don't have one
const createMissingTenantRecords = async (req, res) => {
  try {
    console.log('Creating missing tenant records...');
    
    // Find all confirmed bookings
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    console.log(`Found ${confirmedBookings.length} confirmed bookings`);
    
    const results = {
      created: 0,
      existing: 0,
      errors: []
    };
    
    for (const booking of confirmedBookings) {
      try {
        // Check if tenant record already exists
        const existingTenant = await Tenant.findOne({ bookingId: booking._id });
        
        if (existingTenant) {
          results.existing++;
          console.log(`Tenant already exists for booking ${booking._id}`);
          continue;
        }
        
        // Fetch property and room details
        const property = await Property.findById(booking.propertyId);
        const room = await Room.findById(booking.roomId);
        
        // Fetch owner details from user service
        let ownerDetails = {
          name: booking.ownerName || 'Owner',
          email: '',
          phone: ''
        };
        
        try {
          const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
          const ownerResponse = await axios.get(`${userServiceUrl}/public/user/${booking.ownerId}`);
          if (ownerResponse.data) {
            ownerDetails = {
              name: ownerResponse.data.name || 'Owner',
              email: ownerResponse.data.email || '',
              phone: ownerResponse.data.phone || ownerResponse.data.phoneNumber || ''
            };
          }
        } catch (err) {
          console.error(`Error fetching owner details for booking ${booking._id}:`, err.message);
        }
        
        // Create tenant record
        const tenant = new Tenant({
          userId: booking.userId,
          userName: booking.userSnapshot?.name || 'User',
          userEmail: booking.userSnapshot?.email || '',
          userPhone: booking.userSnapshot?.phone || '',
          propertyId: booking.propertyId,
          propertyName: property?.property_name || booking.propertySnapshot?.name || 'Property',
          roomId: booking.roomId,
          roomNumber: room?.room_number?.toString() || booking.roomSnapshot?.roomNumber?.toString() || 'N/A',
          ownerId: booking.ownerId,
          ownerName: ownerDetails.name,
          ownerEmail: ownerDetails.email,
          ownerPhone: ownerDetails.phone,
          bookingId: booking._id,
          paymentId: booking.payment?.razorpayPaymentId,
          razorpayOrderId: booking.payment?.razorpayOrderId,
          razorpayPaymentId: booking.payment?.razorpayPaymentId,
          amountPaid: booking.payment?.totalAmount || 0,
          checkInDate: new Date(),
          checkOutDate: null,
          monthlyRent: booking.payment?.monthlyRent || room?.rent || 0,
          securityDeposit: booking.payment?.securityDeposit || 0,
          status: 'active',
          confirmedBy: booking.approvedBy || booking.ownerId,
          confirmedAt: booking.approvedAt || booking.createdAt,
          specialRequests: '',
        });
        
        await tenant.save();
        results.created++;
        console.log(`Created tenant record for booking ${booking._id}`);
      } catch (err) {
        console.error(`Error creating tenant for booking ${booking._id}:`, err);
        results.errors.push({
          bookingId: booking._id,
          error: err.message
        });
      }
    }
    
    return res.json({
      success: true,
      message: 'Tenant record creation completed',
      results
    });
  } catch (error) {
    console.error('Create missing tenant records error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get all tenants for an owner
const getOwnerTenants = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status } = req.query; // optional filter by status
    const query = { ownerId };
    if (status && ['active', 'completed', 'terminated', 'extended'].includes(status)) {
      query.status = status;
    }

    const tenants = await Tenant.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      tenants,
      count: tenants.length
    });
  } catch (error) {
    console.error('Get owner tenants error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all tenants for a specific property
const getPropertyTenants = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const ownerId = req.user?.id;
    
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenants = await Tenant.find({ propertyId, ownerId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      tenants,
      count: tenants.length
    });
  } catch (error) {
    console.error('Get property tenants error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get tenant details by ID
const getTenantDetails = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Check if user is owner or the tenant themselves
    if (String(tenant.ownerId) !== String(userId) && String(tenant.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.json({
      success: true,
      tenant
    });
  } catch (error) {
    console.error('Get tenant details error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user's tenant records (for seekers)
const getUserTenantRecords = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenants = await Tenant.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      tenants,
      count: tenants.length
    });
  } catch (error) {
    console.error('Get user tenant records error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update tenant status or details
const updateTenantDetails = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const ownerId = req.user?.id;
    const updates = req.body;
    
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Only owner can update tenant details
    if (String(tenant.ownerId) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'status',
      'checkOutDate',
      'actualCheckInDate',
      'actualCheckOutDate',
      'agreementUrl',
      'agreementStartDate',
      'agreementEndDate',
      'notes',
      'monthlyRent',
      'securityDeposit'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        tenant[field] = updates[field];
      }
    });

    await tenant.save();

    return res.json({
      success: true,
      message: 'Tenant details updated successfully',
      tenant
    });
  } catch (error) {
    console.error('Update tenant details error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark tenant as checked in
const markTenantCheckIn = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const ownerId = req.user?.id;
    
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (String(tenant.ownerId) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    tenant.actualCheckInDate = new Date();
    tenant.status = 'active';
    await tenant.save();

    return res.json({
      success: true,
      message: 'Tenant checked in successfully',
      tenant
    });
  } catch (error) {
    console.error('Mark tenant check-in error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark tenant as checked out
const markTenantCheckOut = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const ownerId = req.user?.id;
    
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (String(tenant.ownerId) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    tenant.actualCheckOutDate = new Date();
    tenant.status = 'completed';
    await tenant.save();

    return res.json({
      success: true,
      message: 'Tenant checked out successfully',
      tenant
    });
  } catch (error) {
    console.error('Mark tenant check-out error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get tenants for a specific room (public endpoint)
const getRoomTenants = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room ID is required' 
      });
    }

    // Validate room ID format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid room ID format' 
      });
    }

    // Find the room first to get property details
    const Room = mongoose.model('Room', roomSchema);
    const room = await Room.findById(roomId).populate('property_id');
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Determine tenants by approved/confirmed bookings for this room
    const approvedBookings = await Booking.find({
      roomId: String(roomId),
      status: { $in: ['confirmed', 'approved'] }
    }).sort({ createdAt: -1 }).limit(50);

    // Enrich tenants with age and occupation from user-service
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';
    const uniqueUserIds = [...new Set(approvedBookings.map(b => String(b.userId)).filter(Boolean))];
    const userProfileMap = {};
    try {
      const profiles = await Promise.all(uniqueUserIds.map(async (uid) => {
        try {
          const resp = await fetch(`${USER_SERVICE_URL}/public/user/${uid}`);
          if (resp.ok) {
            const data = await resp.json();
            userProfileMap[uid] = data || {};
          }
        } catch (e) {
          // ignore per-user errors
        }
      }));
    } catch (e) {
      // best-effort enrichment; continue without blocking
    }

    const tenants = approvedBookings.map(b => {
      const uid = String(b.userId);
      const profile = userProfileMap[uid] || {};
      return {
        _id: b.userId,
        name: b.userSnapshot?.name || profile.name || b.userSnapshot?.email || 'Tenant',
        email: b.userSnapshot?.email || profile.email,
        phone: b.userSnapshot?.phone || profile.phone,
        age: profile.age ?? null,
        occupation: profile.occupation ?? null,
        moveInDate: b.checkInDate || b.createdAt,
        status: 'approved'
      };
    });

    console.log(`Found ${tenants.length} approved tenants for room ${roomId}`);

    return res.json({
      success: true,
      tenants,
      roomInfo: {
        roomNumber: room.room_number,
        roomType: room.room_type,
        occupancy: room.occupancy,
        propertyName: room.property_id?.property_name || 'Unknown Property'
      }
    });

  } catch (error) {
    console.error('Get room tenants error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  addProperty,
  getProperties,
  getProperty,
  getPropertyAdmin,
  getApprovedPropertiesPublic,
  getApprovedPropertyPublic,
  updateRoomStatus,
  updateRoom,
  updateProperty,
  uploadImage,
  getAllPropertiesAdmin,
  approveRoomAdmin,
  // new export added below
  approvePropertyAdmin,
  sendAdminMessage,
  getRoomPublic,
  getAllRoomsDebug,
  createBookingPublic,
  listOwnerBookings,
  getPendingApprovalBookings,
  checkUserBookingStatus,
  getUserBookings,
  getBookingDetails,
  getAllBookingsDebug,
  lookupBookingDetails,
  updateBookingStatus,
  cancelAndDeleteBooking,
  createPaymentOrder,
  verifyPaymentAndCreateBooking,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkFavoriteStatus,
  // Tenant management
  createMissingTenantRecords,
  getOwnerTenants,
  getPropertyTenants,
  getTenantDetails,
  getUserTenantRecords,
  updateTenantDetails,
  markTenantCheckIn,
  markTenantCheckOut,
  getRoomTenants
};
