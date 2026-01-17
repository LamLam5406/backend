const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApplyJob = sequelize.define('ApplyJob', {
  // Định nghĩa cột Status để không bị mất khi reset DB
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Đang chờ'
  }
}, {
  tableName: 'apply_job',
  timestamps: true,      // Tự động tạo createdAt, updatedAt
  underscored: true      // Quan trọng: Đổi createdAt -> created_at cho đúng chuẩn SQL
});

module.exports = ApplyJob;