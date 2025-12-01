/**
 * Service xử lý Google Translate
 * Sử dụng API endpoint miễn phí của Google
 */

// Cache để tránh gọi API lại cho cùng một text
const translateCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Pending requests để tránh duplicate API calls
const pendingRequests = new Map();

/**
 * Dịch văn bản
 * @param {string} text - Văn bản cần dịch
 * @param {string} sl - Ngôn ngữ nguồn (source language), mặc định 'en'
 * @param {string} tl - Ngôn ngữ đích (target language), mặc định 'vi'
 */
async function translateText(text, sl = 'en', tl = 'vi') {
    try {
        if (!text) return "";

        // Kiểm tra cache
        const cacheKey = `${sl}:${tl}:${text}`;
        if (translateCache.has(cacheKey)) {
            return translateCache.get(cacheKey);
        }

        // Kiểm tra xem có request đang pending cho cùng text không
        if (pendingRequests.has(cacheKey)) {
            return pendingRequests.get(cacheKey);
        }

        // Giới hạn độ dài để tránh lỗi URL quá dài
        if (text.length > 1000) {
            text = text.substring(0, 1000);
        }

        // URL API Google Translate (client=gtx là endpoint public)
        const url = `https://translate.google.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

        // Tạo promise và lưu vào pending
        const fetchPromise = (async () => {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const textResponse = await response.text();

            try {
                // Google trả về format mảng lồng nhau: [[["Dịch", "Gốc", ...], ...], ...]
                const data = JSON.parse(textResponse);
                if (data && data[0]) {
                    // Nối các đoạn dịch lại với nhau
                    const result = data[0].map(segment => segment[0]).join("");

                    // Lưu vào cache
                    if (translateCache.size >= MAX_CACHE_SIZE) {
                        // Xóa entry cũ nhất
                        const firstKey = translateCache.keys().next().value;
                        translateCache.delete(firstKey);
                    }
                    translateCache.set(cacheKey, result);

                    return result;
                }
            } catch (e) {
                console.error("Lỗi parse JSON từ Google Translate:", e);
            }

            return text; // Fallback: trả về text gốc nếu lỗi
        })();

        // Lưu vào pending
        pendingRequests.set(cacheKey, fetchPromise);

        try {
            const result = await fetchPromise;
            return result;
        } finally {
            pendingRequests.delete(cacheKey);
        }
    } catch (error) {
        console.error("Lỗi khi gọi Google Translate:", error);
        return text;
    }
}

/**
 * Batch translate nhiều text cùng lúc - Tối ưu cho nhiều meanings
 * @param {string[]} texts - Mảng các text cần dịch
 * @param {string} sl - Ngôn ngữ nguồn
 * @param {string} tl - Ngôn ngữ đích
 * @returns {Promise<string[]>} - Mảng kết quả đã dịch
 */
async function batchTranslate(texts, sl = 'en', tl = 'vi') {
    if (!texts || texts.length === 0) return [];

    // Lọc ra những text chưa có trong cache
    const results = new Array(texts.length);
    const toTranslate = [];
    const toTranslateIndexes = [];

    texts.forEach((text, index) => {
        if (!text) {
            results[index] = "";
            return;
        }
        const cacheKey = `${sl}:${tl}:${text}`;
        if (translateCache.has(cacheKey)) {
            results[index] = translateCache.get(cacheKey);
        } else {
            toTranslate.push(text);
            toTranslateIndexes.push(index);
        }
    });

    // Nếu tất cả đã có trong cache, trả về luôn
    if (toTranslate.length === 0) return results;

    // Gộp các text lại bằng separator đặc biệt để dịch 1 lần
    const SEPARATOR = " ||| ";
    const combinedText = toTranslate.join(SEPARATOR);

    // Nếu text quá dài, fallback về translate từng cái
    if (combinedText.length > 2000) {
        const translatedParts = await Promise.all(
            toTranslate.map(t => translateText(t, sl, tl))
        );
        toTranslateIndexes.forEach((origIndex, i) => {
            results[origIndex] = translatedParts[i];
        });
        return results;
    }

    try {
        const translated = await translateText(combinedText, sl, tl);
        const parts = translated.split(/\s*\|\|\|\s*/);

        toTranslateIndexes.forEach((origIndex, i) => {
            const part = parts[i] || toTranslate[i];
            results[origIndex] = part;
            // Cache từng phần
            const cacheKey = `${sl}:${tl}:${toTranslate[i]}`;
            if (!translateCache.has(cacheKey)) {
                if (translateCache.size >= MAX_CACHE_SIZE) {
                    const firstKey = translateCache.keys().next().value;
                    translateCache.delete(firstKey);
                }
                translateCache.set(cacheKey, part);
            }
        });
    } catch (e) {
        // Fallback: trả về text gốc
        toTranslateIndexes.forEach((origIndex, i) => {
            results[origIndex] = toTranslate[i];
        });
    }

    return results;
}

module.exports = {
    translateText,
    batchTranslate
};
