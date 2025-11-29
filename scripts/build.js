const fs = require('fs');
const path = require('path');

// Đường dẫn
const srcDir = path.join(__dirname, '..', 'src');
const publicDir = path.join(__dirname, '..', 'public');
const rootDir = path.join(__dirname, '..');

// Danh sách files extension cần xóa trước khi build (build artifacts)
const extensionFiles = [
    'background.js',
    'content.js',
    'manifest.json',
    'popup.html',
    'popup.js',
    'styles.css',
    'icon16.png',
    'icon48.png',
    'icon128.png'
];

// Xóa các file extension cũ ở root (ngoại trừ dict folder)
console.log('Cleaning old extension files...');
for (const file of extensionFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

// Copy files từ src
function copyRecursive(src, dest) {
    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy từ src với cấu trúc phẳng (flatten)
function copyWithFlatten(sourceDir, targetDir) {
    const files = fs.readdirSync(sourceDir);

    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
            // Xử lý thư mục popup đặc biệt
            if (file === 'popup') {
                const popupFiles = fs.readdirSync(sourcePath);
                for (const popupFile of popupFiles) {
                    fs.copyFileSync(
                        path.join(sourcePath, popupFile),
                        path.join(targetDir, popupFile)
                    );
                }
            }
            // Xử lý thư mục styles
            else if (file === 'styles') {
                const styleFiles = fs.readdirSync(sourcePath);
                for (const styleFile of styleFiles) {
                    // Đổi tên content.css thành styles.css
                    const destName = styleFile === 'content.css' ? 'styles.css' : styleFile;
                    fs.copyFileSync(
                        path.join(sourcePath, styleFile),
                        path.join(targetDir, destName)
                    );
                }
            }
        } else {
            // Copy file thường
            fs.copyFileSync(sourcePath, path.join(targetDir, file));
        }
    }
}

// Copy public
function copyPublicFiles(sourceDir, targetDir) {
    const entries = fs.readdirSync(sourceDir);

    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry);
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
            if (entry === 'icons') {
                // Copy icons trực tiếp vào root (không vào thư mục icons)
                const iconFiles = fs.readdirSync(sourcePath);
                for (const iconFile of iconFiles) {
                    fs.copyFileSync(
                        path.join(sourcePath, iconFile),
                        path.join(targetDir, iconFile)
                    );
                }
            }
            // KHÔNG copy dict folder nữa vì server dùng trực tiếp từ public/dict
        }
    }
}

console.log('Building extension...');

// Copy từ src với flatten
copyWithFlatten(srcDir, rootDir);
console.log('Copied src files to root');

// Copy từ public
copyPublicFiles(publicDir, rootDir);
console.log('Copied public files to root');

// Cập nhật manifest.json trong root để trỏ đúng đường dẫn
const manifestPath = path.join(rootDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Cập nhật đường dẫn trong manifest
if (manifest.action && manifest.action.default_popup) {
    manifest.action.default_popup = 'popup.html';
}

if (manifest.content_scripts) {
    manifest.content_scripts = manifest.content_scripts.map(script => ({
        ...script,
        js: script.js.map(js => js.replace(/^src\//, '')),
        css: script.css ? script.css.map(css => {
            // Đổi content.css về styles.css
            return css.replace(/^src\/styles\/content\.css$/, 'styles.css');
        }) : []
    }));
}

if (manifest.background && manifest.background.service_worker) {
    manifest.background.service_worker = 'background.js';
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Updated manifest.json');

console.log('Build completed! Extension ready at root folder!');
console.log('Load this folder in Chrome: ' + rootDir);
