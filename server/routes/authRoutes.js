const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, changePassword, deleteMe, googleLogin } = require('../controllers/authController');
const { uploadAvatar } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.delete('/me', protect, deleteMe);
router.post('/upload-avatar', protect, uploadAvatar);

module.exports = router;
