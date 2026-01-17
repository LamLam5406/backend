const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db');
const { User, Thesis, Job, ApplyJob } = require('../models'); // Import thêm ApplyJob để test ứng tuyển
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🔄 Đang kết nối và làm sạch Database (MySQL/XAMPP)...');
    
    // 1. Reset Database (Xóa bảng cũ tạo lại)
    await sequelize.sync({ force: true });
    console.log('✅ Database đã được reset!');

    // 2. Chuẩn bị Password & Thư mục Upload
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // --- TỰ ĐỘNG TẠO FILE PDF MẪU ---
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const dummyFileName = 'khoa_luan_mau.pdf';
    const dummyFilePath = path.join(uploadDir, dummyFileName);
    if (!fs.existsSync(dummyFilePath)) {
        fs.writeFileSync(dummyFilePath, 'File PDF giả lập để test.');
        console.log(`📄 Đã tạo file mẫu tại: ${dummyFilePath}`);
    }
    // --------------------------------

    console.log('🌱 Đang tạo Users...');
    // Tạo mảng dữ liệu User
    const usersData = [
      { name: 'Admin Hệ Thống', email: 'admin@hus.edu.vn', password: hashedPassword, role: 'admin' },
      { name: 'Nguyễn Văn An', email: 'student1@hus.edu.vn', password: hashedPassword, role: 'student' },
      { name: 'Trần Thị Bích', email: 'student2@hus.edu.vn', password: hashedPassword, role: 'student' },
      { name: 'FPT Software', email: 'company@fpt.com', password: hashedPassword, role: 'company' },
      { name: 'Viettel Telecom', email: 'hr@viettel.com', password: hashedPassword, role: 'company' },
      { name: 'TS. Lê Bá Vui', email: 'vui.le@hus.edu.vn', password: hashedPassword, role: 'lecturer' }
    ];

    // Lưu vào DB
    await User.bulkCreate(usersData);

    // --- QUAN TRỌNG: QUERY LẠI ĐỂ LẤY ID CHÍNH XÁC TỪ MYSQL ---
    // (Khắc phục lỗi undefined ID khi dùng bulkCreate trên một số bản MySQL)
    const student1 = await User.findOne({ where: { email: 'student1@hus.edu.vn' } });
    const student2 = await User.findOne({ where: { email: 'student2@hus.edu.vn' } });
    const companyFPT = await User.findOne({ where: { email: 'company@fpt.com' } });
    const companyViettel = await User.findOne({ where: { email: 'hr@viettel.com' } });

    if (!student1 || !companyFPT) {
        throw new Error("❌ Không tìm thấy User sau khi tạo. Vui lòng kiểm tra kết nối DB.");
    }

    console.log('🌱 Đang tạo Jobs (Việc làm)...');
    // Tạo Job và hứng lấy kết quả để lát nữa tạo đơn ứng tuyển
    const jobs = await Job.bulkCreate([
      {
        title: 'Backend Developer (Node.js)',
        company_id: companyFPT.user_id, // Lấy ID thật từ DB
        salary: '15 - 20 Triệu',
        location: 'Cầu Giấy, Hà Nội',
        type: 'Toàn thời gian',
        deadline: '2025-12-31',
        description: 'Tham gia phát triển hệ thống EduTech...',
        requirements: 'Thành thạo Node.js, Express, MySQL...',
        benefits: 'Thưởng tháng 13, Laptop Macbook Pro...'
      },
      {
        title: 'Thực tập sinh ReactJS',
        company_id: companyFPT.user_id,
        salary: 'Hỗ trợ 3-5 Triệu',
        location: 'Hòa Lạc, Hà Nội',
        type: 'Thực tập',
        deadline: '2025-10-20',
        description: 'Được đào tạo bài bản về Frontend...',
        requirements: 'Biết cơ bản HTML/CSS/JS...',
        benefits: 'Cơ hội trở thành nhân viên chính thức.'
      },
      {
        title: 'Network Engineer',
        company_id: companyViettel.user_id,
        salary: '20 - 25 Triệu',
        location: 'Ba Đình, Hà Nội',
        type: 'Toàn thời gian',
        deadline: '2025-06-30',
        description: 'Vận hành hệ thống mạng viễn thông 5G...',
        requirements: 'Chứng chỉ CCNA, CCNP là lợi thế...',
        benefits: 'Gói cước viễn thông miễn phí trọn đời.'
      }
    ]);
    
    // Query lại Job để lấy ID (cho chắc ăn)
    const jobDev = await Job.findOne({ where: { title: 'Backend Developer (Node.js)' } });

    console.log('🌱 Đang tạo Theses (Khóa luận)...');
    await Thesis.bulkCreate([
      {
        title: 'Nghiên cứu ứng dụng AI trong Y tế',
        // SỬA LẠI TÊN CỘT CHO KHỚP VỚI MODEL Thesis.js
        author_id: student1.user_id, // Model khai báo là author_id
        year: 2024,
        supervisor: 'TS. Lê Bá Vui',
        faculty: 'Toàn - Cơ - Tin học',
        abstract: 'Đề tài tập trung vào việc chẩn đoán hình ảnh X-Quang...',
        status: 'approved',
        theses_url: dummyFileName, // Model khai báo là theses_url (không phải file_url)
        createdAt: new Date()
      },
      {
        title: 'Xây dựng hệ thống quản lý thư viện',
        author_id: student1.user_id,
        year: 2025,
        supervisor: 'ThS. Nguyễn Văn A',
        faculty: 'Toán - Cơ - Tin học',
        abstract: 'Hệ thống web app quản lý mượn trả sách...',
        status: 'pending',
        theses_url: dummyFileName,
        createdAt: new Date()
      }
    ]);

    console.log('🌱 Đang tạo mẫu Đơn ứng tuyển (ApplyJob)...');
    if (jobDev && student2) {
        await ApplyJob.create({
            job_id: jobDev.job_id,
            student_id: student2.user_id,
            status: 'Đang chờ'
        });
        console.log('   -> Student 2 đã ứng tuyển vào Job Dev');
    }

    console.log('🎉 KHỞI TẠO DỮ LIỆU THÀNH CÔNG!');
    console.log('------------------------------------------------');
    console.log('👤 Admin:     admin@hus.edu.vn / 123456');
    console.log('👤 Công ty:   company@fpt.com / 123456');
    console.log('👤 Sinh viên: student1@hus.edu.vn / 123456');
    console.log('------------------------------------------------');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi Seed Data:', error);
    process.exit(1);
  }
};

seedDatabase();