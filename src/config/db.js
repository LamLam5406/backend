const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: 4000, // TiDB luôn dùng cổng 4000
    dialect: 'mysql',
    logging: false,
    timezone: '+07:00',
    // THÊM ĐOẠN NÀY ĐỂ KẾT NỐI ĐƯỢC TIDB:
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true 
      }
    }
  }
);

module.exports = sequelize;