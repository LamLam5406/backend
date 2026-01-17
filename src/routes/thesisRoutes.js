const express = require('express');
const router = express.Router();
const thesisController = require('../controllers/thesisController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- CẤU HÌNH MULTER THÔNG MINH ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folderPath = '';

    // 1. Phân loại thư mục dựa trên tên trường (fieldname)
    if (file.fieldname === 'cover') {
      folderPath = 'uploads/covers/';
    } else {
      folderPath = 'uploads/documents/';
    }

    // 2. Tự động tạo thư mục nếu chưa có (tránh lỗi crash app)
    // Dùng { recursive: true } để tạo cả đường dẫn cha nếu cần
    if (!fs.existsSync(folderPath)){
        fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// --- BỘ LỌC FILE (GIỮ NGUYÊN) ---
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'file') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Tài liệu bắt buộc phải là file PDF!'), false);
    }
  } else if (file.fieldname === 'cover') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Ảnh bìa phải là định dạng ảnh (JPG, PNG)!'), false);
    }
  } else {
    cb(new Error('Trường file không xác định!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// ... (Các đoạn code Route bên dưới giữ nguyên) ...
router.get('/search', thesisController.searchTheses);
router.get('/search-ai', thesisController.searchSemantic);
router.get('/pending', thesisController.getPendingTheses);
router.get('/', thesisController.getAllTheses);
router.get('/:id', thesisController.getThesisById);

router.post('/', 
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), 
  thesisController.createThesis
);

router.put('/:id', 
  verifyToken, 
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), 
  thesisController.updateThesis
);

router.put('/:id/approve', verifyToken, thesisController.approveThesis);

module.exports = router;