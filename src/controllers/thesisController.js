const { Thesis, User } = require('../models');
const aiService = require('../services/aiService');
const { Op } = require('sequelize');
const fs = require('fs'); // Để xóa file cũ nếu cần (Optional)

// Helper: Hàm tạo URL từ file object của Multer
const generateUrl = (req, file) => {
  // file.path sẽ là 'uploads\documents\file.pdf' (Windows) hoặc 'uploads/documents/file.pdf' (Mac/Linux)
  // Ta cần chuẩn hóa thành URL: 'http://localhost:5000/uploads/documents/file.pdf'
  
  // 1. Lấy đường dẫn tương đối và đổi dấu gạch chéo ngược (\) thành xuôi (/)
  const relativePath = file.path.replace(/\\/g, '/'); 
  
  // 2. Ghép với domain
  return `${req.protocol}://${req.get('host')}/${relativePath}`;
};

const thesisController = {

  // 1. CREATE THESIS
  createThesis: async (req, res) => {
    try {
      const { title, abstract, year, author_id, supervisor, faculty, type } = req.body;
      
      let fileUrl = null;
      let coverUrl = null;
      let embeddingVector = null;
      
      // XỬ LÝ PDF
      if (req.files && req.files['file']) {
        const pdfFile = req.files['file'][0];
        fileUrl = generateUrl(req, pdfFile); // <--- Dùng hàm helper mới
        
        // AI Vectorization
        try {
            const pdfText = await aiService.readPdfContent(pdfFile.path);
            const contentToEmbed = `${title} . ${abstract} . ${pdfText}`;
            embeddingVector = await aiService.getEmbedding(contentToEmbed);
        } catch (err) {
            console.error("AI Error:", err.message);
        }
      }

      // XỬ LÝ ẢNH BÌA
      if (req.files && req.files['cover']) {
        const coverFile = req.files['cover'][0];
        coverUrl = generateUrl(req, coverFile); // <--- Dùng hàm helper mới
      }

      const newThesis = await Thesis.create({
        title, abstract, year, author_id, supervisor, faculty, type,
        theses_url: fileUrl,
        cover_url: coverUrl,
        embedding: embeddingVector,
        status: 'pending' // Mặc định chờ duyệt
      });

      return res.status(201).json({ message: 'Thành công', data: newThesis });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // 2. THÊM HÀM CHO ADMIN: Lấy bài đang chờ (Pending)
  getPendingTheses: async (req, res) => {
    try {
      const theses = await Thesis.findAll({
        where: { status: 'pending' }, // <--- CHỈ LẤY BÀI CHỜ DUYỆT
        include: [{ model: User, as: 'author', attributes: ['name'] }],
        order: [['created_at', 'ASC']] // Bài cũ hiện trước để duyệt trước
      });
      return res.status(200).json({ data: theses });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // 3. THÊM HÀM DUYỆT BÀI
  approveThesis: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'approved' hoặc 'rejected'

      await Thesis.update({ status }, { where: { theses_id: id } });
      
      return res.status(200).json({ message: `Đã cập nhật trạng thái: ${status}` });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // 2. XEM TẤT CẢ KHÓA LUẬN (Read All)
  getAllTheses: async (req, res) => {
    try {
      const theses = await Thesis.findAll({
        where: { status: 'approved' }, // <--- CHỈ LẤY BÀI ĐÃ DUYỆT
        // Kèm thông tin tác giả (User), nhưng chỉ lấy tên và email để bảo mật
        include: [{
          model: User,
          as: 'author',
          attributes: ['name', 'email', 'role']
        }],
        order: [['created_at', 'DESC']] // Sắp xếp cái mới nhất lên đầu
      });

      return res.status(200).json({
        message: 'Lấy danh sách khóa luận thành công',
        count: theses.length,
        data: theses
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // 3. XEM CHI TIẾT MỘT KHÓA LUẬN (Read One)
  getThesisById: async (req, res) => {
    try {
      const { id } = req.params;

      const thesis = await Thesis.findByPk(id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['name', 'email']
        }]
      });

      if (!thesis) {
        return res.status(404).json({ message: 'Không tìm thấy khóa luận' });
      }

      return res.status(200).json({
        message: 'Lấy thông tin thành công',
        data: thesis
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // --- HÀM MỚI: CẬP NHẬT TÀI LIỆU ---
  // 2. UPDATE THESIS (Sửa lại logic xử lý file)
  updateThesis: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, abstract, faculty, year, supervisor, type } = req.body;
      const userId = req.user.id; 

      const thesis = await Thesis.findByPk(id);
      if (!thesis) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

      if (thesis.author_id !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền sửa tài liệu này' });
      }

      // Cập nhật thông tin text
      thesis.title = title || thesis.title;
      thesis.abstract = abstract || thesis.abstract;
      thesis.faculty = faculty || thesis.faculty;
      thesis.year = year || thesis.year;
      thesis.supervisor = supervisor || thesis.supervisor;
      thesis.type = type || thesis.type;

      // XỬ LÝ FILE MỚI (Nếu có upload lại)
      // Lưu ý: Do dùng upload.fields, ta phải check req.files chứ không phải req.file
      
      // 1. Update PDF
      if (req.files && req.files['file']) {
        const newPdf = req.files['file'][0];
        thesis.theses_url = generateUrl(req, newPdf);
        
        // (Optional) Tính lại AI nếu đổi file...
      }

      // 2. Update Ảnh bìa
      if (req.files && req.files['cover']) {
        const newCover = req.files['cover'][0];
        thesis.cover_url = generateUrl(req, newCover);
      }

      // Sửa xong phải duyệt lại
      thesis.status = 'pending';

      await thesis.save();

      return res.status(200).json({ message: 'Cập nhật thành công! Tài liệu đang chờ duyệt lại.', data: thesis });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // 4. TÌM KIẾM KHÓA LUẬN (Search)
  // URL ví dụ: /api/theses/search?q=machine learning
  searchTheses: async (req, res) => {
    try {
      const { q } = req.query; // Lấy từ khóa từ query param

      if (!q) {
        return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
      }

      const results = await Thesis.findAll({
        where: {
          [Op.or]: [
            // Tìm trong tiêu đề HOẶC tìm trong tóm tắt
            { title: { [Op.like]: `%${q}%` } },
            { abstract: { [Op.like]: `%${q}%` } },
            { supervisor: { [Op.like]: `%${q}%` } } // Tìm theo tên GV hướng dẫn luôn nếu thích
          ]
        },
        include: [{
          model: User,
          as: 'author',
          attributes: ['name']
        }]
      });

      return res.status(200).json({
        message: `Tìm thấy ${results.length} kết quả cho từ khóa "${q}"`,
        data: results
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },
  // --- THÊM HÀM TÌM KIẾM AI MỚI ---
  searchSemantic: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ message: 'Vui lòng nhập từ khóa' });

      console.log(`🔎 Đang tìm kiếm Hybrid cho: "${q}"`);

      // BƯỚC 1: TÌM KIẾM CƠ BẢN (SQL LIKE) - Để bắt từ khóa chính xác
      const keywordResults = await Thesis.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${q}%` } },
            { abstract: { [Op.like]: `%${q}%` } }
          ]
        },
        include: [{ model: User, as: 'author', attributes: ['name'] }]
      });

      // BƯỚC 2: TÌM KIẾM AI (VECTOR) - Để bắt ngữ nghĩa
      let aiResults = [];
      try {
        const queryVector = await aiService.getEmbedding(q);
        
        // Lấy tất cả bài có vector
        const allTheses = await Thesis.findAll({
          where: {
            embedding: { [Op.not]: null } // Chỉ lấy bài đã có vector
          },
          include: [{ model: User, as: 'author', attributes: ['name'] }]
        });

        // Tính điểm
        aiResults = allTheses.map(thesis => {
          // Parse JSON vector từ DB
          let dbVector = thesis.embedding;
          if (typeof dbVector === 'string') {
             // Đề phòng trường hợp MySQL lưu dạng string
             dbVector = JSON.parse(dbVector);
          }

          const score = aiService.calculateSimilarity(queryVector, dbVector);
          return { ...thesis.toJSON(), score: score };
        })
        .filter(item => item.score > 0.2) // Hạ ngưỡng lọc xuống thấp hơn
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Lấy top 5 AI

      } catch (err) {
        console.error("⚠️ Lỗi phần AI (vẫn trả về kết quả thường):", err.message);
        // Nếu AI lỗi, vẫn tiếp tục để trả về kết quả keyword
      }

      // BƯỚC 3: GỘP KẾT QUẢ (Merge & Deduplicate)
      // Tạo một Map để loại bỏ trùng lặp (ưu tiên kết quả AI có điểm số)
      const finalMap = new Map();

      // Đưa kết quả AI vào trước
      aiResults.forEach(item => {
        finalMap.set(item.theses_id, { ...item, type: 'AI Match 🤖', score: item.score });
      });

      // Đưa kết quả Keyword vào (nếu chưa có thì thêm, nếu có rồi thì giữ nguyên AI vì nó có score)
      keywordResults.forEach(item => {
        if (!finalMap.has(item.theses_id)) {
          finalMap.set(item.theses_id, { ...item.toJSON(), type: 'Keyword Match 📝', score: 1.0 }); // Score giả lập cao nhất
        } else {
            // Nếu đã có (tức là vừa khớp từ khóa, vừa khớp AI) -> Đây là kết quả tốt nhất
            const existing = finalMap.get(item.theses_id);
            finalMap.set(item.theses_id, { ...existing, type: 'Perfect Match ⭐' });
        }
      });

      // Chuyển về mảng và sắp xếp lại
      const finalResults = Array.from(finalMap.values())
        .sort((a, b) => {
           // Ưu tiên Perfect Match -> Keyword Match -> AI Match
           const priority = { 'Perfect Match ⭐': 3, 'Keyword Match 📝': 2, 'AI Match 🤖': 1 };
           return priority[b.type] - priority[a.type] || b.score - a.score;
        });

      return res.status(200).json({
        message: `Tìm thấy ${finalResults.length} kết quả`,
        data: finalResults
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  }
};

module.exports = thesisController;