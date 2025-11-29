// Node.js Backend Server
// Entry point chính của ứng dụng

const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");

// Cấu hình
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Cho phép Chrome extension gọi API
app.use(express.json()); // Parse JSON body

// Routes
// Mount tất cả routes bắt đầu bằng /api vào apiRoutes
app.use("/api", apiRoutes);

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`🏥 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🈯 API Translate: http://localhost:${PORT}/api/translate`);
  console.log("\n--- Hướng dẫn ---");
  console.log("1. Load extension vào Chrome (từ thư mục gốc JPExtension/)");
  console.log("2. Bôi đen text tiếng Nhật trên web để dịch");
});
