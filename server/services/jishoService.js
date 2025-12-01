const JishoAPI = require("unofficial-jisho-api");
const kuroshiroService = require("./kuroshiroService");

// Khởi tạo Jisho Client
const jisho = new JishoAPI();

// Cache để tăng tốc tra từ
const wordCache = new Map();
const kanjiCache = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * Tra từ điển Jisho
 * @param {string} text - Từ cần tra
 * @returns {Promise<Object>} - Kết quả tra từ
 */
async function searchWord(text) {
    try {
        // Kiểm tra cache
        if (wordCache.has(text)) {
            return wordCache.get(text);
        }

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

            // 3. Lấy ví dụ (Examples) - Chạy song song không chờ
            // Tối ưu: Không await để trả kết quả nhanh hơn
            const examplesPromise = getExamplesOptimized(text);

            const result = {
                success: true,
                hiragana: hiragana || text,
                meanings: meanings,
                word: japanese.word || text,
                examples: [], // Sẽ điền sau
            };

            // Đợi examples (tối đa 500ms)
            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 500)
                );
                result.examples = await Promise.race([examplesPromise, timeoutPromise]);
            } catch (e) {
                // Timeout hoặc lỗi - trả về mảng rỗng
                result.examples = [];
            }

            // Lưu vào cache
            if (wordCache.size >= MAX_CACHE_SIZE) {
                const firstKey = wordCache.keys().next().value;
                wordCache.delete(firstKey);
            }
            wordCache.set(text, result);

            return result;
        }

        // Cache kết quả không tìm thấy
        const notFound = { success: false };
        wordCache.set(text, notFound);
        return notFound;
    } catch (error) {
        console.error("Lỗi Jisho API:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Lấy ví dụ câu từ Jisho - Phiên bản tối ưu
 * Không gọi furigana để tăng tốc
 */
async function getExamplesOptimized(text) {
    let examples = [];
    try {
        const examplesData = await jisho.searchForExamples(text);

        if (examplesData.results && examplesData.results.length > 0) {
            // Lấy tối đa 2 ví dụ đầu tiên
            const rawExamples = examplesData.results.slice(0, 2);

            // Không gọi furigana để tăng tốc - sẽ xử lý lazy ở client
            examples = rawExamples.map((result) => {
                const japanese = result.kanji || result.kana || "";
                return {
                    japanese: japanese,
                    english: result.english || "",
                    html: japanese // Sẽ thêm furigana sau nếu cần
                };
            });
        }
    } catch (err) {
        // Không log lỗi này để tránh spam console
    }
    return examples;
}

/**
 * Lấy ví dụ câu từ Jisho - Phiên bản đầy đủ với furigana
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
        // Kiểm tra cache
        if (kanjiCache.has(kanji)) {
            return kanjiCache.get(kanji);
        }

        const result = await jisho.searchForKanji(kanji);
        if (result.found) {
            const kanjiResult = {
                found: true,
                kanji: result.query,
                meanings: result.meaning.split(', '),
                kunyomi: result.kunyomi,
                onyomi: result.onyomi,
                jlpt: result.jlptLevel
            };

            // Lưu vào cache
            if (kanjiCache.size >= MAX_CACHE_SIZE) {
                const firstKey = kanjiCache.keys().next().value;
                kanjiCache.delete(firstKey);
            }
            kanjiCache.set(kanji, kanjiResult);

            return kanjiResult;
        }

        const notFound = { found: false };
        kanjiCache.set(kanji, notFound);
        return notFound;
    } catch (error) {
        console.error(`Lỗi tra Kanji ${kanji}:`, error);
        return { found: false };
    }
}

module.exports = {
    searchWord,
    searchKanji
};
