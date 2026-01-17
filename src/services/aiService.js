const fs = require('fs');
const pdfParse = require('pdf-parse'); // Lúc này nó đã là bản chuẩn 1.1.1

// Import động thư viện transformers
let pipeline;

const aiService = {
  // 1. Khởi tạo Model
  getExtractor: async () => {
    if (!pipeline) {
      const transformer = await import('@xenova/transformers');
      pipeline = transformer.pipeline;
    }
    return await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  },

  // 2. Đọc nội dung file PDF
  readPdfContent: async (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File không tồn tại: ${filePath}`);
      }

      const dataBuffer = fs.readFileSync(filePath);

      // Thư viện chuẩn 1.1.1 chạy lệnh này rất mượt
      const data = await pdfParse(dataBuffer);
      
      console.log(`✅ Đọc xong PDF. Độ dài text: ${data.text.length} ký tự`);
      return data.text;

    } catch (error) {
      console.error("❌ Lỗi đọc PDF:", error.message);
      return ""; 
    }
  },

  // 3. Biến văn bản thành Vector
  getEmbedding: async (text) => {
    if (!text || text.trim().length === 0) return null;
    try {
      const extractor = await aiService.getExtractor();
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error("❌ Lỗi tạo Embedding:", error);
      return null;
    }
  },

  // 4. Tính độ tương đồng
  calculateSimilarity: (vecA, vecB) => {
    if (!vecA || !vecB) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
};

module.exports = aiService;