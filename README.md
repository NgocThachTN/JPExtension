# JP Extension - Japanese to Vietnamese Translator

Chrome Extension để dịch tiếng Nhật sang tiếng Việt với hỗ trợ hiển thị hiragana, furigana và ví dụ sử dụng từ vựng.

<img width="1141" height="737" alt="image" src="https://github.com/user-attachments/assets/f303159b-9a07-41c2-9860-6a31e30c6ed1" />


## Tổng quan

JP Extension là một công cụ dịch thuật tiếng Nhật chuyên nghiệp, tích hợp với Jisho.org API để cung cấp bản dịch chính xác, hiragana, nghĩa tiếng Anh và ví dụ sử dụng từ vựng. Extension tự động phát hiện khi người dùng chọn text tiếng Nhật trên trang web và hiển thị popup dịch với giao diện gọn gàng, thân thiện.

## Tính năng

- Dịch tự động từ tiếng Nhật sang tiếng Việt
- Hiển thị hiragana và nghĩa tiếng Anh cho từ vựng
- Furigana tự động cho Kanji trong ví dụ
- Ví dụ sử dụng từ vựng trong câu
- Giao diện popup gọn gàng, ưu tiên layout ngang
- Tự động định vị popup thông minh
- Hỗ trợ cả từ vựng đơn và câu dài

## Yêu cầu hệ thống

- Node.js phiên bản 18.0.0 trở lên
- Google Chrome hoặc trình duyệt Chromium
- npm (đi kèm với Node.js)

## Dependencies

Project sử dụng các package Node.js sau:

- `express`: Framework web server
- `cors`: Cho phép cross-origin requests
- `kuroshiro`: Xử lý chuyển đổi và phân tích text tiếng Nhật
- `kuroshiro-analyzer-kuromoji`: Analyzer cho Kuroshiro
- `unofficial-jisho-api`: Client cho Jisho.org API
- `japanese`: Xử lý text tiếng Nhật
- `canvas`: Hỗ trợ rendering (cho một số tính năng nâng cao)

## Cài đặt

### Phương án 1: Sử dụng Backend đã deploy (Khuyến nghị)

Backend server đã được deploy lên Vercel và sẵn sàng sử dụng. Bạn có thể sử dụng extension trực tiếp mà không cần chạy server local.

1. Build Extension:

```bash
npm install
npm run build
```

2. Cài đặt Extension vào Chrome:
   - Mở Chrome và truy cập `chrome://extensions/`
   - Bật chế độ Developer mode ở góc trên bên phải
   - Nhấp vào nút "Load unpacked"
   - Chọn thư mục gốc `JPExtension/` (thư mục chứa `manifest.json`)
   - Extension đã sẵn sàng sử dụng

### Phương án 2: Chạy Backend local (Cho phát triển)

Nếu muốn chạy backend server trên máy local:

1. Cài đặt dependencies:

```bash
npm install
```

2. Khởi động Backend Server:

```bash
npm start
```

Server sẽ chạy tại `http://localhost:3000`. Nếu port 3000 bị chiếm, có thể thay đổi biến môi trường `PORT` hoặc sửa trong `server/server.js`.

3. Cập nhật API endpoint trong `src/content.js`:

Thay đổi URL từ `https://jp-extension.vercel.app/api/translate` sang `http://localhost:3000/api/translate`

4. Build và cài đặt Extension (theo hướng dẫn ở Phương án 1)

## Cách sử dụng

1. Mở bất kỳ trang web nào có text tiếng Nhật
2. Bôi đen (chọn) text tiếng Nhật mà bạn muốn dịch
3. Popup sẽ tự động hiển thị với các thông tin:
   - Text gốc (tiếng Nhật)
   - Hiragana của từ đó
   - Nghĩa tiếng Anh (ghi chú)
   - Bản dịch tiếng Việt
   - Ví dụ sử dụng từ (nếu có, với Furigana ở trên Kanji)

### Chế độ hoạt động

Extension tự động phân biệt giữa hai chế độ:

- **Chế độ tra từ**: Khi chọn text ngắn (≤ 20 ký tự), extension sẽ tra từ điển Jisho và hiển thị đầy đủ thông tin bao gồm hiragana, nghĩa tiếng Anh, nghĩa tiếng Việt và ví dụ
- **Chế độ dịch câu**: Khi chọn text dài (> 20 ký tự), extension sẽ sử dụng Google Translate để dịch toàn bộ câu

## Cấu trúc Project

```
JPExtension/
├── src/                       # Source code của Extension
│   ├── background.js          # Service worker cho extension
│   ├── content.js             # Script chạy trên web pages, xử lý selection và popup
│   ├── manifest.json          # Cấu hình Chrome extension
│   ├── popup/                 # Extension popup
│   │   ├── popup.html         # Giao diện popup extension (kiểm tra kết nối server)
│   │   └── popup.js           # Logic cho popup extension
│   └── styles/
│       └── content.css        # CSS cho popup translation
├── server/                    # Backend Server
│   └── server.js              # Backend Node.js server với Jisho API integration
├── public/                    # Assets tĩnh
│   ├── icons/                 # Icons cho extension
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── dict/                  # Dictionary files cho Kuromoji analyzer
├── scripts/                   # Build và utility scripts
│   └── build.js               # Script build extension
├── health.html                # Trang health check cho server
├── package.json               # Dependencies và scripts
├── README.md                  # Tài liệu này
│
├── [Generated files khi build - gitignored]
├── background.js              # Built from src/
├── content.js                 # Built from src/
├── manifest.json              # Built from src/
├── popup.html                 # Built from src/popup/
├── popup.js                   # Built from src/popup/
├── styles.css                 # Built from src/styles/content.css
├── icon16.png                 # Copied from public/icons/
├── icon48.png                 # Copied from public/icons/
├── icon128.png                # Copied from public/icons/
└── dict/                      # Copied from public/dict/
```

**Lưu ý**: Các file ở root (background.js, content.js, v.v.) được tạo tự động khi chạy `npm run build` và được gitignore.

## Build Extension

Để build extension từ source code:

```bash
npm run build
```

Extension sẽ được build vào **thư mục gốc** (root folder). Các file extension sẽ xuất hiện cùng cấp với `package.json`.

### Build Scripts

- `npm run build`: Build extension từ src/ và public/ ra root folder
- `npm run clean`: Xóa các file extension đã build ở root
- `npm run rebuild`: Clean + build lại
- `npm run watch`: Tự động build khi có thay đổi (cần cài nodemon)


## API Endpoints

Backend server cung cấp các endpoints sau:

- `POST /api/translate`: Dịch text tiếng Nhật sang tiếng Việt

  - Body: `{ "text": "日本語のテキスト" }`
  - Response: `{ "success": true, "original": "...", "hiragana": "...", "translation": "...", "english": "...", "examples": [...] }`

- `GET /api/health`: Kiểm tra trạng thái server
  - Response: HTML page hiển thị trạng thái server

## Tích hợp API

Extension đã tích hợp sẵn các API sau:

- **Jisho.org API**: Tra từ điển tiếng Nhật, lấy nghĩa, hiragana và ví dụ
- **Google Translate API**: Dịch câu dài và các từ không tìm thấy trong Jisho
- **Kuroshiro**: Xử lý chuyển đổi text tiếng Nhật và tạo Furigana

## Xử lý lỗi

### Không thể kết nối server

- Nếu sử dụng backend đã deploy: Kiểm tra kết nối internet và đảm bảo URL API đúng
- Nếu chạy local: Đảm bảo đã chạy `npm start` và server đang chạy tại `http://localhost:3000`

### Popup không hiển thị

- Mở Developer Tools (F12) và kiểm tra Console để xem lỗi
- Đảm bảo text được chọn có chứa ký tự tiếng Nhật (Hiragana, Katakana, hoặc Kanji)
- Kiểm tra xem extension đã được bật trong `chrome://extensions/`

### Dịch không chính xác hoặc không có kết quả

- Extension sử dụng Jisho.org API, nếu từ không có trong từ điển sẽ fallback sang Google Translate
- Đối với câu dài, extension tự động sử dụng Google Translate
- Kiểm tra console để xem log chi tiết

### Lỗi khi khởi động server

- Đảm bảo Node.js phiên bản 18.0.0 trở lên
- Chạy `npm install` để cài đặt đầy đủ dependencies
- Kiểm tra xem thư mục `dict/` có đầy đủ files không

## Phát triển

### Chạy ở chế độ development

```bash
npm run dev
```

### Cấu hình môi trường

Có thể cấu hình port server thông qua biến môi trường:

```bash
PORT=3000 npm start
```

### Testing

1. Mở trang web có text tiếng Nhật (ví dụ: https://www3.nhk.or.jp/news/easy/)
2. Chọn text tiếng Nhật
3. Kiểm tra popup hiển thị đúng

## Lưu ý

- Extension hoạt động độc lập với backend đã deploy, không cần chạy server local
- Backend sử dụng Jisho.org API miễn phí, có giới hạn rate limit
- Furigana được tạo tự động bằng Kuroshiro, có thể mất thời gian khởi tạo lần đầu
- Extension chỉ hoạt động trên các trang web cho phép content scripts

## License

MIT License
