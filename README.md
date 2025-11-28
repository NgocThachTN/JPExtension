# 🇯🇵 Japanese to Vietnamese Translator - Chrome Extension

Extension Chrome để dịch tiếng Nhật sang tiếng Việt và hiển thị hiragana khi bôi đen text.

## 📋 Yêu cầu

- Node.js (phiên bản 14 trở lên)
- Google Chrome hoặc Chromium browser
- npm (đi kèm với Node.js)

## 📦 Dependencies

Project sử dụng các package Node.js sau (tự động cài đặt với `npm install`):

- `express`: Framework web server
- `cors`: Cho phép cross-origin requests
- `japanese`: Xử lý text tiếng Nhật (tùy chọn, cho tính năng nâng cao)

## 🚀 Cài đặt

### Bước 1: Cài đặt dependencies

Mở terminal trong thư mục project và chạy:

```bash
npm install
```

Nếu gặp lỗi với package nào đó, có thể bỏ qua hoặc cài riêng:

```bash
npm install express cors
# npm install japanese  # Tùy chọn cho xử lý Furigana
```

### Bước 2: Khởi động Backend Server

```bash
npm start
```

Server sẽ chạy tại `http://localhost:3000`. Nếu port 3000 bị chiếm, sửa trong `server.js`.

### Bước 3: Load Extension vào Chrome

1. Mở Chrome và vào `chrome://extensions/`
2. Bật **Developer mode** (góc trên bên phải)
3. Click **Load unpacked**
4. Chọn thư mục `JPExtension` (thư mục chứa `manifest.json`)
5. Extension đã được cài đặt!

## 📖 Cách sử dụng

1. Đảm bảo server đang chạy (`npm start`)
2. Mở bất kỳ trang web nào có text tiếng Nhật
3. **Bôi đen** (select) text tiếng Nhật
4. Popup sẽ tự động hiển thị:
   - Text gốc (tiếng Nhật)
   - Hiragana của từ đó
   - Bản dịch tiếng Việt
   - **Ví dụ sử dụng** (nếu có, với Furigana ở trên Kanji)

### Tính năng đặc biệt

- **Furigana**: Hiển thị Hiragana ở trên Kanji để dễ đọc
- **Ví dụ**: Popup có thể hiển thị các ví dụ câu sử dụng từ, với Furigana
- **Vị trí thông minh**: Popup tự động định vị bên phải text, điều chỉnh khi scroll
- **Ẩn thanh scroll**: Popup scroll mượt mà mà không hiển thị thanh cuộn

## 🛠️ Cấu trúc Project

```
JPExtension/
├── manifest.json          # Cấu hình Chrome extension
├── content.js            # Script chạy trên web pages
├── popup.html            # Giao diện popup extension
├── popup.js              # Logic popup
├── background.js         # Service worker
├── styles.css            # CSS cho popup translation
├── server.js             # Backend Node.js server
├── package.json          # Dependencies
└── README.md             # Hướng dẫn này
```

## 🔧 Mở rộng Dictionary

Để thêm từ mới vào từ điển, mở file `server.js` và thêm vào object `dictionary`:

```javascript
const dictionary = {
  '新しい単語': { translation: 'Nghĩa tiếng Việt', hiragana: 'あたらしいたんご' },
  // Thêm từ mới ở đây...
};
```

## 🌐 Tích hợp API Dịch Thật (Tùy chọn)

Hiện tại extension sử dụng dictionary đơn giản. Để dịch chính xác hơn, bạn có thể tích hợp:

- **Google Translate API**
- **Jisho.org API** (từ điển tiếng Nhật miễn phí)
- **MyMemory Translation API**

Ví dụ với Jisho API:

```javascript
// Trong server.js, thay thế phần translate
const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${text}`);
const data = await response.json();
// Xử lý data...
```

## 🐛 Xử lý lỗi

- **Không thể kết nối server**: Đảm bảo đã chạy `npm start`
- **Popup không hiển thị**: Kiểm tra console (F12) để xem lỗi
- **Dịch không chính xác**: Thêm từ vào dictionary hoặc tích hợp API dịch

## 📝 Lưu ý

- Extension chỉ hoạt động khi server đang chạy
- Dictionary hiện tại có số lượng từ hạn chế
- Để sử dụng production, nên tích hợp API dịch thật

## 📄 License

MIT

