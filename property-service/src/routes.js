const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { addProperty, getProperties, getProperty, getApprovedPropertiesPublic, getApprovedPropertyPublic, updateRoomStatus, updateRoom, updateProperty } = require('./controller');
const axios = require('axios');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Supabase client for server-side auth verification
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

// User-service base URL (for KYC/role checks)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002/api';

// Auth middleware order of precedence:
// 1) Explicit Mongo user id via x-user-id header
// 2) Custom JWT (Mongo user-service) with USER_JWT_SECRET -> extract _id/id
// 3) Supabase JWT via supabase.auth.getUser
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const fallbackUserId = req.headers['x-user-id'];

    // Prefer explicit Mongo user id if provided
    if (fallbackUserId) {
      req.user = { id: String(fallbackUserId) };
      return next();
    }

    // Try verifying custom JWT issued by your user-service (Mongo)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.USER_JWT_SECRET || process.env.JWT_SECRET || process.env.USER_SERVICE_JWT_SECRET;
      if (secret) {
        try {
          const payload = jwt.verify(token, secret);
          const mongoId = payload?._id || payload?.id || payload?.userId || payload?.sub;
          if (mongoId) {
            req.user = { id: String(mongoId) };
            return next();
          }
        } catch (_) {
          // Ignore and continue to Supabase verification
        }
      }
    }

    if (supabase && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        req.user = { id: data.user.id };
        return next();
      }
    }

    return res.status(401).json({ success: false, message: 'Access token or user id required' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Ensure the requester is an Owner and has uploaded govt ID (KYC)
const ensureOwnerKYC = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Forward Authorization header if available to user-service
    const headers = {};
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    // Fetch user profile from user-service
    const url = `${USER_SERVICE_URL}/user/profile/${userId}`;
    const { data: user } = await axios.get(url, { headers });

    // Basic role/verification checks
    const isOwner = Number(user?.role) === 3;
    const isEmailVerified = user?.isVerified === true;
    
    // KYC checks: accept admin-approved KYC with at least one document present
    const hasGovtIdFront = Boolean(user?.govtIdFrontUrl);
    const hasGovtIdBack = Boolean(user?.govtIdBackUrl);
    const hasAnyKycDoc = hasGovtIdFront || hasGovtIdBack;
    const adminApproved = user?.kycVerified === true || user?.kycStatus === 'approved';
    const isKycVerified = adminApproved && hasAnyKycDoc;

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Only property owners can add properties' });
    }

    if (!isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Verify your email before adding properties' });
    }

    if (!isKycVerified) {
      return res.status(403).json({ success: false, message: 'Upload and get your Government ID approved by admin before adding a property' });
    }

    return next();
  } catch (error) {
    console.error('ensureOwnerKYC error:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url
    });
    // If user-service says unauthorized/forbidden, bubble up
    if (error?.response?.status === 401) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (error?.response?.status === 403) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.status(500).json({ success: false, message: 'Failed to validate owner KYC', details: error?.response?.data || null });
  }
};

// Routes

// Create a specific multer configuration for add property
const addPropertyUpload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).fields([
  // Property images
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 },
  { name: 'hallImage', maxCount: 1 },
  { name: 'kitchenImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
  
  // Room images (up to 6 rooms)
  { name: 'rooms[0][roomImage]', maxCount: 1 },
  { name: 'rooms[0][toiletImage]', maxCount: 1 },
  { name: 'rooms[1][roomImage]', maxCount: 1 },
  { name: 'rooms[1][toiletImage]', maxCount: 1 },
  { name: 'rooms[2][roomImage]', maxCount: 1 },
  { name: 'rooms[2][toiletImage]', maxCount: 1 },
  { name: 'rooms[3][roomImage]', maxCount: 1 },
  { name: 'rooms[3][toiletImage]', maxCount: 1 },
  { name: 'rooms[4][roomImage]', maxCount: 1 },
  { name: 'rooms[4][toiletImage]', maxCount: 1 },
  { name: 'rooms[5][roomImage]', maxCount: 1 },
  { name: 'rooms[5][toiletImage]', maxCount: 1 },
  
  // Dormitory images
  { name: 'dormitoryImages', maxCount: 20 },
  { name: 'dormitoryToiletImage', maxCount: 1 },
  
  // Other images
  { name: 'outsideToiletImage', maxCount: 1 },
  { name: 'landTaxReceipt', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]);

router.post('/properties/add', authenticateUser, addPropertyUpload, addProperty);
router.get('/properties', authenticateUser, getProperties);
router.get('/properties/:id', authenticateUser, getProperty);

// Room management routes
router.patch('/rooms/:roomId/status', authenticateUser, updateRoomStatus);

// Configure multer for room updates
const roomUpdateUpload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).fields([
  { name: 'room_image', maxCount: 1 },
  { name: 'toilet_image', maxCount: 1 }
]);

router.patch('/rooms/:roomId', authenticateUser, roomUpdateUpload, updateRoom);

// Property management routes
router.patch('/properties/:id', authenticateUser, updateProperty);

// Public routes (no authentication required)
router.get('/public/properties', getApprovedPropertiesPublic);
router.get('/public/properties/:id', getApprovedPropertyPublic);

module.exports = router;
