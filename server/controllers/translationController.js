const translationService = require("../services/translationService");

/**
 * Controller xử lý request dịch thuật
 */
async function translate(req, res) {
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
        const result = await translationService.translateJapanese(trimmedText);

        // Trả về kết quả
        res.json(result);
    } catch (error) {
        console.error("Lỗi controller:", error);
        res.json({
            success: false,
            error: "Lỗi server: " + error.message,
            original: req.body.text || "",
        });
    }
}

module.exports = {
    translate
};
