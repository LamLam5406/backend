const { Job, User, ApplyJob } = require('../models');
const sequelize = require('../config/db'); // Import sequelize để chạy raw query

const jobController = {

  // 1. ĐĂNG VIỆC (Dành cho Company)
  createJob: async (req, res) => {
    try {
      // Destructure thêm type và benefits
      const { title, company_id, description, requirements, salary, location, deadline, type, benefits } = req.body;
      
      if (!title || !company_id) {
        return res.status(400).json({ message: 'Thiếu thông tin tiêu đề hoặc ID công ty' });
      }

      const company = await User.findByPk(company_id);
      if (!company || company.role !== 'company') {
        return res.status(400).json({ message: 'ID không hợp lệ hoặc User không phải là công ty' });
      }

      const newJob = await Job.create({
        title,
        company_id,
        description,
        requirements,
        salary,
        location,
        deadline,
        // --- LƯU THÊM 2 TRƯỜNG MỚI ---
        type: type || 'Toàn thời gian', // Nếu không gửi lên thì mặc định
        benefits
        // -----------------------------
      });

      return res.status(201).json({
        message: 'Đăng tin tuyển dụng thành công',
        data: newJob
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // 2. XEM TẤT CẢ VIỆC LÀM (Dành cho Student)
  getAllJobs: async (req, res) => {
    try {
      const jobs = await Job.findAll({
        include: [{
          model: User,
          as: 'company', // Lấy thông tin công ty đăng bài
          attributes: ['name', 'email'] // Chỉ lấy tên và email
        }],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({ data: jobs });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getJobById : async (req, res) => {
    try {
      const { id } = req.params;

      // GIẢ LẬP: Nếu bạn chưa kết nối DB thật, hãy tìm trong mảng mẫu
      // Nếu dùng MongoDB/Mongoose thì: const job = await Job.findById(id);
      
      // Ví dụ code tìm trong DB (giả định model là Job):
      const job = await Job.findOne({ where: { job_id: id } }); // Nếu dùng SQL/Sequelize
      // Hoặc: const job = await Job.findById(id); // Nếu dùng MongoDB

      if (!job) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy công việc này'
        });
      }

      res.status(200).json({
        status: 'success',
        data: job
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Lỗi server khi lấy chi tiết công việc'
      });
    }
  },
  // 3. ỨNG TUYỂN (Sinh viên nộp đơn) -> Xử lý bảng trung gian
  applyJob: async (req, res) => {
    try {
      const { job_id, student_id } = req.body;

      // Tìm Job và Student
      const job = await Job.findByPk(job_id);
      const student = await User.findByPk(student_id);

      if (!job || !student) {
        return res.status(404).json({ message: 'Không tìm thấy công việc hoặc sinh viên' });
      }

      // Kiểm tra xem đã nộp đơn chưa (Tránh spam nộp 2 lần)
      // hasApplicant là hàm tự động sinh ra bởi Sequelize khi thiết lập quan hệ N-N
      const hasApplied = await job.hasApplicant(student);
      if (hasApplied) {
        return res.status(400).json({ message: 'Bạn đã nộp đơn cho công việc này rồi' });
      }

      // Thực hiện nộp đơn (Thêm vào bảng trung gian apply_job)
      await job.addApplicant(student);

      return res.status(200).json({ message: 'Nộp đơn ứng tuyển thành công!' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // --- HÀM MỚI: Cập nhật trạng thái (Dùng Model chuẩn) ---
  updateApplicationStatus: async (req, res) => {
    try {
      const { job_id, student_id, status } = req.body;

      console.log(`🔄 Đang update: Job ${job_id} - Student ${student_id} -> ${status}`);

      // Sử dụng Model để update thay vì SQL tay
      // Sequelize sẽ tự động tìm đúng tên cột trong DB
      const updatedCount = await ApplyJob.update(
        { status: status }, // Dữ liệu cần sửa
        { 
          where: { 
            job_id: job_id, 
            student_id: student_id 
          } 
        }
      );

      if (updatedCount[0] === 0) {
        // Nếu = 0 nghĩa là không tìm thấy dòng nào để update
        return res.status(404).json({ message: 'Không tìm thấy đơn ứng tuyển này để cập nhật' });
      }

      return res.status(200).json({ message: 'Cập nhật trạng thái thành công!' });
    } catch (error) {
      console.error("Lỗi update:", error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // 4. XEM DANH SÁCH ỨNG VIÊN (SỬA LẠI ĐỂ LẤY THÊM STATUS)
  getJobApplicants: async (req, res) => {
    try {
      const { id } = req.params;
      const job = await Job.findByPk(id, {
        include: [{
          model: User,
          as: 'applicants',
          attributes: ['user_id', 'name', 'email'],
          through: { 
            attributes: ['created_at', 'status'] // <--- LẤY THÊM CỘT STATUS
          }
        }]
      });
      // ... phần còn lại giữ nguyên
      if (!job) return res.status(404).json({ message: 'Job not found' });
      return res.status(200).json({ applicants: job.applicants });
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
  }
};

module.exports = jobController;