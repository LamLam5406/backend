const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Thesis = sequelize.define('Thesis', {
  theses_id: { // Lưu ý: Trong hình ghi là 'theses_id' (số nhiều)
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  abstract: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Tên bảng
      key: 'user_id'
    }
  },
  supervisor: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  faculty: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cover_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  theses_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  embedding: {
    type: DataTypes.JSON, // Lưu mảng vector dưới dạng JSON
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING,   // 'pending', 'approved', 'rejected'
    defaultValue: 'pending',  // Mặc định là Chờ duyệt
    allowNull: false
  }
}, {
  tableName: 'theses',
  timestamps: false
});

module.exports = Thesis;