const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { requireStudent } = require('../middleware/authorize');
const { uploadImage } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const router = express.Router();

// Configure multer for memory storage (we'll stream the buffer to Cloudinary)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * POST /api/upload
 * Uploads a single image to Cloudinary and returns the URL and public ID.
 * Restricted to authenticated users.
 */
router.post(
  '/',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, 'No image file provided.', 400);
      }

      // Stream the buffer to Cloudinary
      const result = await uploadImage(req.file.buffer, {
        folder: `hostel_system/complaints/${req.user._id}`,
      });

      return sendSuccess(res, {
        imageUrl: result.imageUrl,
        imagePublicId: result.publicId,
      }, 'Image uploaded successfully', 201);
      
    } catch (error) {
      console.error('Image upload error:', error);
      
      // Handle multer limit errors
      if (error.message && error.message.includes('too large')) {
        return sendError(res, 'Image size exceeds the 5MB limit.', 400);
      }
      
      return sendError(res, 'Failed to upload image. Please try again.', 500);
    }
  }
);

module.exports = router;
