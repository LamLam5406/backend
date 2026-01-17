const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Đăng ký & Đăng nhập
router.post('/register', userController.register);
router.post('/login', userController.login);

// Lấy thông tin chi tiết user
router.get('/:id', userController.getProfile);

module.exports = router;