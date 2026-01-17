const express = require('express');
const cors = require('cors'); // Nếu chưa có: npm install cors
const morgan = require('morgan'); // (Tùy chọn) log request: npm install morgan

// Import các file routes
const thesisRoutes = require('./routes/thesisRoutes');
const userRoutes = require('./routes/userRoutes'); // Khi nào bạn tạo controller user thì mở comment này
const jobRoutes = require('./routes/jobRoutes');   // Khi nào bạn tạo controller job thì mở comment này

const app = express();

// --- Middlewares ---
app.use('/uploads', express.static('uploads')); // Cho phép truy cập thư mục uploads từ bên ngoài
app.use(cors()); // Cho phép frontend (React/Vue) gọi API
app.use(express.json()); // Quan trọng: Để đọc được body JSON từ request POST/PUT
app.use(express.urlencoded({ extended: true })); // Để đọc dữ liệu từ form
app.use(morgan('dev')); // Log request ra console để dễ debug

// --- Routes ---
// Định nghĩa đường dẫn gốc cho các resource
app.use('/api/theses', thesisRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// Route kiểm tra server sống hay chết (Health check)
app.get('/', (req, res) => {
  res.send('University Ecosystem API is running...');
});

// Xử lý lỗi 404 (Không tìm thấy route)
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Xử lý lỗi tập trung (Error Handling Middleware)
app.use((error, req, res, next) => {
  // --- THÊM DÒNG NÀY ĐỂ IN LỖI RA TERMINAL ---
  console.error("❌ LỖI SERVER:", error); 
  // ------------------------------------------
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;