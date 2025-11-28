// Script tạo icon cho Chrome Extension
// Sử dụng package 'canvas' để tạo PNG

const fs = require('fs');
const path = require('path');

// Kiểm tra xem có package canvas không
let canvas;
try {
  canvas = require('canvas');
} catch (e) {
  console.log('⚠️  Package "canvas" chưa được cài đặt.');
  console.log('📦 Đang cài đặt...');
  console.log('\n💡 Nếu lỗi, hãy mở file generate-icons.html trong browser và download icons thủ công.\n');
  process.exit(1);
}

function createIcon(size, filename) {
  const canvasElement = canvas.createCanvas(size, size);
  const ctx = canvasElement.getContext('2d');

  // Nền xanh lá (#4CAF50)
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, size, size);

  // Vẽ chữ J (Japanese) màu trắng
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('J', size / 2, size / 2);

  // Vẽ viền tròn
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, Math.floor(size * 0.05));
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();

  // Lưu file
  const buffer = canvasElement.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Đã tạo: ${filename} (${size}x${size})`);
}

// Tạo các icon
console.log('🎨 Đang tạo icons...\n');
createIcon(16, 'icon16.png');
createIcon(48, 'icon48.png');
createIcon(128, 'icon128.png');
console.log('\n✨ Hoàn thành! Icons đã được tạo trong thư mục hiện tại.');

