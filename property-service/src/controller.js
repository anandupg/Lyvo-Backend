const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');

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

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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
      createdAt: property.createdAt
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

module.exports = {
  addProperty,
  getProperties,
  getProperty,
  getApprovedPropertiesPublic,
  getApprovedPropertyPublic,
  updateRoomStatus,
  updateRoom,
  updateProperty,
  uploadImage
};
