const { User, Thesis, Job } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userController = {
  
  // 1. ĐĂNG KÝ (REGISTER)
  register: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // Validate
      if (!email || !password || !role) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ email, password và role' });
      }

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email này đã được sử dụng' });
      }

      // Mã hóa password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Tạo user mới
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role
      });

      // Trả về thông tin (nhưng giấu password đi)
      return res.status(201).json({
        message: 'Đăng ký thành công',
        user: {
          id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // 2. ĐĂNG NHẬP (LOGIN)
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Tìm user theo email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'Email không tồn tại' });
      }

      // So sánh password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu không đúng' });
      }

      // --- PHẦN MỚI: TẠO TOKEN ---
      // (Dùng đúng cái key bí mật bạn đã viết trong middleware nhé)
      const token = jwt.sign(
        { 
          id: user.user_id, 
          role: user.role, 
          email: user.email 
        },
        process.env.JWT_SECRET || 'day_la_mat_khau_bi_mat', // <--- Key bí mật
        { expiresIn: '1d' } // Token sống 1 ngày
      );

      // Trả về Token cho Frontend
      return res.status(200).json({
        message: 'Đăng nhập thành công',
        token: token, // <--- Frontend cần cái này để lưu vào localStorage
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // 3. XEM PROFILE (Bao gồm cả các bài đã đăng)
  getProfile: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }, // Tuyệt đối không trả về password
        include: [
          { model: Thesis, as: 'theses' },      // Nếu là sinh viên, lấy danh sách khóa luận
          { model: Job, as: 'postedJobs' },      // Nếu là công ty, lấy danh sách job đã đăng
          { 
            model: Job, 
            as: 'appliedJobs',                  // Lấy job đã nộp đơn (cho Student)
            through: { attributes: ['status'] },        // Bỏ qua dữ liệu bảng trung gian
            include: [                          // Lấy luôn tên công ty của job đó
              { model: User, as: 'company', attributes: ['name'] } 
            ]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ message: 'User không tồn tại' });
      }

      return res.status(200).json({ data: user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  }
};

module.exports = userController;