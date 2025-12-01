const Kuroshiro = require("kuroshiro").default;
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");
const path = require("path");

// Khởi tạo instance
const kuroshiro = new Kuroshiro();
let isInitialized = false;

// Cache để tăng tốc convert
const hiraganaCache = new Map();
const furiganaCache = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * Khởi tạo Kuroshiro với từ điển
 */
async function init() {
    if (isInitialized) return;

    try {
        console.log("Đang khởi tạo Kuroshiro...");
        // Trỏ đến thư mục dict trong public (Source of truth)
        const dictPath = path.join(__dirname, '..', '..', 'public', 'dict');

        await kuroshiro.init(new KuromojiAnalyzer({
            dictPath: dictPath
        }));

        isInitialized = true;
        console.log("Kuroshiro đã khởi tạo thành công!");
    } catch (err) {
        console.error("Lỗi khởi tạo Kuroshiro:", err);
    }
}

/**
 * Đợi Kuroshiro khởi tạo xong
 */
async function waitForInit() {
    if (isInitialized) return true;

    let retries = 0;
    while (!isInitialized && retries < 20) { // Đợi tối đa 2 giây
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }
    return isInitialized;
}

/**
 * Thêm Furigana vào text
 * @param {string} text - Text tiếng Nhật
 * @returns {Promise<string>} - HTML string với thẻ ruby
 */
async function addFurigana(text) {
    await waitForInit();

    if (!isInitialized || !text) return text;

    // Kiểm tra cache
    if (furiganaCache.has(text)) {
        return furiganaCache.get(text);
    }

    try {
        // Nếu đã có thẻ ruby thì không xử lý nữa
        if (text.includes("<ruby>")) return text;

        const result = await kuroshiro.convert(text, {
            mode: "furigana",
            to: "hiragana"
        });

        // Lưu vào cache
        if (furiganaCache.size >= MAX_CACHE_SIZE) {
            const firstKey = furiganaCache.keys().next().value;
            furiganaCache.delete(firstKey);
        }
        furiganaCache.set(text, result);

        return result;
    } catch (e) {
        console.error("Lỗi convert Kuroshiro:", e);
        return text;
    }
}

/**
 * Chuyển đổi sang Hiragana
 * @param {string} text 
 */
async function toHiragana(text) {
    await waitForInit();
    if (!isInitialized) return "";

    // Kiểm tra cache
    if (hiraganaCache.has(text)) {
        return hiraganaCache.get(text);
    }

    try {
        const result = await kuroshiro.convert(text, { to: "hiragana", mode: "normal" });

        // Lưu vào cache
        if (hiraganaCache.size >= MAX_CACHE_SIZE) {
            const firstKey = hiraganaCache.keys().next().value;
            hiraganaCache.delete(firstKey);
        }
        hiraganaCache.set(text, result);

        return result;
    } catch (e) {
        console.error("Lỗi convert Hiragana:", e);
        return "";
    }
}

// Tự động khởi tạo khi import
init();

module.exports = {
    addFurigana,
    toHiragana,
    waitForInit
};
