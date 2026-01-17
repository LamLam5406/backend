const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Job = sequelize.define('Job', {
  job_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // --- THÊM TRƯỜNG TYPE ---
  type: {
    type: DataTypes.STRING(50), // VD: "Toàn thời gian", "Thực tập"
    allowNull: true,
    defaultValue: 'Toàn thời gian'
  },
  // ------------------------
  description: {
    type: DataTypes.TEXT, 
    allowNull: true
  },
  requirements: {
    type: DataTypes.TEXT, 
    allowNull: true
  },
  // --- THÊM TRƯỜNG BENEFITS ---
  benefits: {
    type: DataTypes.TEXT, // Quyền lợi được hưởng
    allowNull: true
  },
  // ---------------------------
  salary: {
    type: DataTypes.STRING(100), 
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATEONLY, 
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'jobs',
  timestamps: false
});

module.exports = Job;