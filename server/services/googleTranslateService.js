/**
 * Service xử lý Google Translate
 * Sử dụng API endpoint miễn phí của Google
 */

/**
 * Dịch văn bản
 * @param {string} text - Văn bản cần dịch
 * @param {string} sl - Ngôn ngữ nguồn (source language), mặc định 'en'
 * @param {string} tl - Ngôn ngữ đích (target language), mặc định 'vi'
 */
async function translateText(text, sl = 'en', tl = 'vi') {
    try {
        if (!text) return "";

        // Giới hạn độ dài để tránh lỗi URL quá dài
        if (text.length > 1000) {
            text = text.substring(0, 1000);
        }

        // URL API Google Translate (client=gtx là endpoint public)
        const url = `https://translate.google.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

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
                return data[0].map(segment => segment[0]).join("");
            }
        } catch (e) {
            console.error("Lỗi parse JSON từ Google Translate:", e);
        }

        return text; // Fallback: trả về text gốc nếu lỗi
    } catch (error) {
        console.error("Lỗi khi gọi Google Translate:", error);
        return text;
    }
}

module.exports = {
    translateText
};
