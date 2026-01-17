require('dotenv').config(); // Load biến môi trường từ file .env
const http = require('http');
const app = require('./app');
const sequelize = require('./config/db'); // Import kết nối DB
require('./models'); // Import models để Sequelize nhận diện các mối quan hệ (associations)

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

async function startServer() {
  try {
    // 1. Kiểm tra kết nối Database
    await sequelize.authenticate();
    console.log('✅ Connection to Database has been established successfully.');

    // 2. Đồng bộ Models với Database
    // force: false => Không xóa bảng cũ nếu đã tồn tại (An toàn)
    // alter: true  => Tự động sửa bảng nếu bạn thay đổi code model (Thêm cột, đổi kiểu...)
    await sequelize.sync({ alter: true }); 
    console.log('✅ All models were synchronized successfully.');

    // 3. Khởi chạy Server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

startServer();