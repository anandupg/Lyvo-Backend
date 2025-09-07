const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { addProperty, getProperties, getProperty } = require('./controller');

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

// Routes
router.post('/properties/add', authenticateUser, upload.any(), addProperty);
router.get('/properties', authenticateUser, getProperties);
router.get('/properties/:id', authenticateUser, getProperty);

module.exports = router;
