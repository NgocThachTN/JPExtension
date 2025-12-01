// Vercel Serverless Function - Translation API

// Lazy load để tránh lỗi khi khởi động
let translationService = null;

async function getTranslationService() {
    if (!translationService) {
        try {
            translationService = require("../server/services/translationService");
        } catch (error) {
            console.error("Lỗi load translationService:", error);
            throw error;
        }
    }
    return translationService;
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        // Validate input
        if (!text || text.trim() === "") {
            return res.json({
                success: false,
                error: "Vui lòng nhập text cần dịch",
            });
        }

        const trimmedText = text.trim();

        // Gọi service xử lý logic
        const service = await getTranslationService();
        const result = await service.translateJapanese(trimmedText);

        // Trả về kết quả
        return res.json(result);
    } catch (error) {
        console.error("Lỗi API translate:", error);
        return res.status(500).json({
            success: false,
            error: "Lỗi server: " + error.message,
            original: req.body?.text || "",
        });
    }
};
