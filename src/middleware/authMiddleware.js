const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Lấy token từ header của request
  // Client sẽ gửi lên dạng: "Authorization: Bearer <token_o_day>"
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Lấy phần token sau chữ Bearer

  if (!token) {
    return res.status(401).json({ message: 'Truy cập bị từ chối. Bạn chưa đăng nhập!' });
  }

  try {
    // 2. Giải mã token bằng mã bí mật (JWT_SECRET)
    // Biến process.env.JWT_SECRET phải trùng với biến bạn dùng lúc tạo token khi đăng nhập
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_tam_thoi');

    // 3. Nếu đúng, lưu thông tin user (id, role...) vào biến req.user
    req.user = verified; 
    
    // 4. Cho phép đi tiếp vào Controller
    next(); 
  } catch (error) {
    res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = { verifyToken };