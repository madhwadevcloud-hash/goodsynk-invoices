const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

// Multer: keep file in memory (no disk write)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// Helper: stream buffer → Cloudinary
const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'invoice_generator/avatars',
        transformation: [{ width: 800, crop: 'limit' }],
        format: 'jpg',
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// @desc    Upload avatar to Cloudinary + save URL on user
// @route   POST /api/auth/upload-avatar
// @access  Private
const uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const result = await streamUpload(req.file.buffer);

      // Save URL to user document
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { businessLogo: result.secure_url },
        { new: true }
      );

      res.json({ success: true, url: result.secure_url, user });
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      res.status(500).json({ success: false, message: err.message || 'Upload failed' });
    }
  },
];

module.exports = { uploadAvatar };
