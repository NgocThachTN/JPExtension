# Cấu trúc Project - JP Extension

## Tổng quan

Project đã được tái cấu trúc theo chuẩn NodeJS Extension với các thư mục chuyên biệt, nhưng vẫn **user-friendly** - bạn chỉ cần load thư mục gốc vào Chrome!

```
JPExtension/
├── src/              # Source code của Chrome Extension
├── server/           # Backend API server
├── public/           # Static assets (icons, dictionary files)
├── scripts/          # Build scripts
└── [root]            # Extension files (generated khi build)
```

## Chi tiết cấu trúc

### 📁 `src/` - Extension Source Code

Chứa toàn bộ source code của Chrome Extension:

- **`background.js`** - Service worker, xử lý background tasks
- **`content.js`** - Content script chạy trên web pages, xử lý selection & popup
- **`manifest.json`** - Chrome extension configuration
- **`popup/`** - Extension popup (click vào icon trong toolbar)
  - `popup.html` - Giao diện popup
  - `popup.js` - Logic popup
- **`styles/`** - CSS files
  - `content.css` - Styles cho translation popup (sẽ đổi tên thành `styles.css` khi build)

### 📁 `server/` - Backend Server

Chứa Express.js server cho API:

- **`server.js`** - Main server file với endpoints:
  - `POST /api/translate` - Dịch tiếng Nhật sang tiếng Việt
  - `GET /api/health` - Health check

### 📁 `public/` - Static Assets

Chứa các file tĩnh không thay đổi:

- **`icons/`** - Extension icons (16x16, 48x48, 128x128)
- **`dict/`** - Dictionary files cho Kuromoji analyzer (12 files .dat.gz)

### 📁 `scripts/` - Build Scripts

Chứa build script:

- **`build.js`** - Build script chính, tạo extension files ở root folder

### 📂 Root Folder - Extension Files (Generated)

Các file này được tạo tự động khi chạy `npm run build` và **được gitignore**:

```
JPExtension/ (root)
├── manifest.json       # Built from src/
├── background.js       # Built from src/
├── content.js          # Built from src/
├── popup.html          # Built from src/popup/
├── popup.js            # Built from src/popup/
├── styles.css          # Built from src/styles/content.css
├── icon16.png          # Copied from public/icons/
├── icon48.png          # Copied from public/icons/
├── icon128.png         # Copied from public/icons/
└── dict/               # Copied from public/dict/
```

**⚠️ QUAN TRỌNG**: KHÔNG edit trực tiếp các file này! Chúng sẽ bị ghi đè khi build lại.

## Workflow Development

### 1. **Phát triển Extension**

Làm việc với code trong `src/`:
```bash
# Edit files trong src/
code src/content.js
code src/popup/popup.html
# etc...
```

### 2. **Build Extension**

Build từ source ra root folder:
```bash
npm run build
```

Build script sẽ:
- Xóa các file extension cũ ở root
- Copy files từ `src/` với cấu trúc flat
- Copy assets từ `public/`
- Cập nhật `manifest.json` với đường dẫn đúng
- Đổi tên `content.css` → `styles.css`

### 3. **Load vào Chrome**

1. Mở `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked"
4. Chọn thư mục **gốc** `JPExtension/` (chứa manifest.json)

✅ **Thân thiện với người dùng**: Chỉ cần chọn thư mục gốc, không cần vào subfolder!

### 4. **Phát triển Server**

Chạy server locally:
```bash
npm start
# hoặc
npm run dev
```

Server chạy tại `http://localhost:3000`

## NPM Scripts

| Command | Mô tả |
|---------|-------|
| `npm start` | Khởi động backend server |
| `npm run dev` | Khởi động server ở dev mode |
| `npm run build` | Build extension từ src/ ra root folder |
| `npm run clean` | Xóa extension files ở root |
| `npm run rebuild` | Clean + Build |
| `npm run watch` | Auto-rebuild khi file thay đổi (cần nodemon) |

## File Mapping

Khi build, files được map như sau:

| Source | Destination (Root) |
|--------|-------------|
| `src/background.js` | `background.js` |
| `src/content.js` | `content.js` |
| `src/manifest.json` | `manifest.json` (updated) |
| `src/popup/popup.html` | `popup.html` |
| `src/popup/popup.js` | `popup.js` |
| `src/styles/content.css` | `styles.css` |
| `public/icons/*` | `*.png` (flatten) |
| `public/dict/` | `dict/` |

## Gitignore

Các file extension ở root được ignore trong Git vì:
- Là build output, có thể tạo lại bất cứ lúc nào từ `src/`
- Tránh commit binary files và duplicated code
- Giữ repo sạch sẽ, chỉ chứa source code

Files được gitignore:
- `/background.js`
- `/content.js`
- `/manifest.json`
- `/popup.html`
- `/popup.js`
- `/styles.css`
- `/icon*.png`
- `/dict/`

## Lưu ý quan trọng

1. ✅ **LUÔN làm việc trong `src/` và `public/`**, KHÔNG edit trực tiếp files ở root
2. ✅ **Chạy `npm run build`** sau mỗi lần thay đổi code
3. ✅ **Reload extension** trong Chrome sau khi build
4. ⚠️ Files extension ở root sẽ bị ghi đè mỗi lần build, mọi thay đổi trực tiếp sẽ mất

## Ưu điểm của cấu trúc này

### ✅ Cho Developer:
- Code được tổ chức rõ ràng theo module
- Separation of concerns: Extension / Server / Assets
- Dễ maintain và scale
- Có source control tốt (chỉ commit source, không commit build output)

### ✅ Cho End User:
- **Thân thiện**: Chỉ cần load thư mục gốc, không cần vào subfolder phức tạp
- Đơn giản: `npm install` → `npm run build` → Load vào Chrome
- Không cần hiểu biết về cấu trúc bên trong

## Best Practices

1. **Development workflow**:
   ```bash
   # 1. Thay đổi code trong src/
   code src/content.js
   
   # 2. Build
   npm run build
   
   # 3. Reload extension trong Chrome
   ```

2. **Khi pull code mới**:
   ```bash
   git pull
   npm install
   npm run build
   ```

3. **Trước khi commit**:
   - Chỉ commit code trong `src/`, `server/`, `public/`, `scripts/`
   - KHÔNG commit files extension ở root (đã gitignore)
   - Test kỹ extension sau khi build

4. **Debugging**:
   - Nếu extension lỗi, kiểm tra console trong Chrome DevTools
   - Nếu build lỗi, xem terminal output
   - Nếu cần clean build: `npm run rebuild`
