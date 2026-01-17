const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Đường dẫn đến file cấu hình db của bạn

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true // Dựa trên hình không thấy đánh dấu required, bạn có thể đổi thành false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true, // Email thường là duy nhất
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'lecturer', 'company', 'admin'),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false, // Tắt timestamps mặc định của Sequelize (createdAt, updatedAt)
  // Nếu bạn muốn Sequelize tự quản lý created_at, hãy cấu hình lại:
  // timestamps: true,
  // createdAt: 'created_at',
  // updatedAt: false
});

module.exports = User;