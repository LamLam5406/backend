const sequelize = require('../config/db');
const User = require('./User');
const Thesis = require('./Thesis');
const Job = require('./Job');
const ApplyJob = require('./ApplyJob'); // <--- 1. Import vào

// Quan hệ User - Thesis (Giữ nguyên)
User.hasMany(Thesis, { foreignKey: 'author_id', as: 'theses' });
Thesis.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Quan hệ User - Job (Công ty đăng việc) (Giữ nguyên)
User.hasMany(Job, { foreignKey: 'company_id', as: 'postedJobs' });
Job.belongsTo(User, { foreignKey: 'company_id', as: 'company' });

// --- QUAN HỆ N-N: ỨNG TUYỂN (SỬA LẠI) ---
// Thay vì through: 'apply_job' (chuỗi), ta dùng through: ApplyJob (Model)

// Sinh viên nộp nhiều Job
User.belongsToMany(Job, { 
  through: ApplyJob, // <--- 2. Dùng Model này
  as: 'appliedJobs',
  foreignKey: 'student_id'
});

// Job có nhiều sinh viên nộp
Job.belongsToMany(User, { 
  through: ApplyJob, // <--- 3. Dùng Model này
  as: 'applicants',
  foreignKey: 'job_id'
});

// Xuất thêm ApplyJob ra để dùng nếu cần
module.exports = {
  sequelize,
  User,
  Thesis,
  Job,
  ApplyJob 
};