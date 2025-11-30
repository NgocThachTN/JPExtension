const JishoAPI = require("unofficial-jisho-api");
const kuroshiroService = require("./kuroshiroService");

// Khởi tạo Jisho Client
const jisho = new JishoAPI();

/**
 * Tra từ điển Jisho
 * @param {string} text - Từ cần tra
 * @returns {Promise<Object>} - Kết quả tra từ
 */
async function searchWord(text) {
    try {
        const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const firstResult = data.data[0];
            const japanese = firstResult.japanese[0];

            // 1. Lấy Hiragana (Reading)
            let hiragana = "";
            if (japanese.reading) {
                hiragana = japanese.reading;
            } else if (japanese.word && /[\u3040-\u309F\u30A0-\u30FF]/.test(japanese.word)) {
                hiragana = japanese.word;
            }

            // 2. Lấy nghĩa tiếng Anh
            let meanings = [];
            if (firstResult.senses && firstResult.senses.length > 0) {
                const firstSense = firstResult.senses[0];
                meanings = firstSense.english_definitions || [];
            }

            // 3. Lấy ví dụ (Examples)
            let examples = await getExamples(text);

            return {
                success: true,
                hiragana: hiragana || text,
                meanings: meanings,
                word: japanese.word || text,
                examples: examples,
            };
        }

        return { success: false };
    } catch (error) {
        console.error("Lỗi Jisho API:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Lấy ví dụ câu từ Jisho
 */
async function getExamples(text) {
    let examples = [];
    try {
        const examplesData = await jisho.searchForExamples(text);

        if (examplesData.results && examplesData.results.length > 0) {
            // Lấy tối đa 2 ví dụ đầu tiên
            const rawExamples = examplesData.results.slice(0, 2);

            examples = await Promise.all(rawExamples.map(async (result) => {
                const japanese = result.kanji || result.kana || "";
                // Thêm Furigana vào câu ví dụ
                const html = await kuroshiroService.addFurigana(japanese);

                return {
                    japanese: japanese,
                    english: result.english || "",
                    html: html
                };
            }));

            // Lọc bỏ những ví dụ lỗi
            examples = examples.filter((ex) => ex.japanese);
        }
    } catch (err) {
        // Không log lỗi này để tránh spam console vì Jisho hay lỗi phần examples
    }
    return examples;
}

/**
 * Tra thông tin Kanji
 * @param {string} kanji - Ký tự Kanji
 */
async function searchKanji(kanji) {
    try {
        const result = await jisho.searchForKanji(kanji);
        if (result.found) {
            return {
                found: true,
                kanji: result.query, // Jisho trả về 'query' là ký tự Kanji
                meanings: result.meaning.split(', '), // Jisho trả về string ngăn cách bởi dấu phẩy
                kunyomi: result.kunyomi,
                onyomi: result.onyomi,
                jlpt: result.jlptLevel
            };
        }
        return { found: false };
    } catch (error) {
        console.error(`Lỗi tra Kanji ${kanji}:`, error);
        return { found: false };
    }
}

module.exports = {
    searchWord,
    searchKanji
};
