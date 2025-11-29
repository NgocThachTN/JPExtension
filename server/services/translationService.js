const jishoService = require("./jishoService");
const googleTranslateService = require("./googleTranslateService");
const kuroshiroService = require("./kuroshiroService");

// Cache lưu kết quả để tăng tốc độ
const dictionaryCache = {};

/**
 * Hàm xử lý chính: Dịch tiếng Nhật sang tiếng Việt
 * @param {string} text - Text cần dịch
 */
async function translateJapanese(text) {
    // 1. Kiểm tra Cache
    if (dictionaryCache[text]) {
        return dictionaryCache[text];
    }

    // 2. Chế độ Dịch câu (Sentence Mode) - Text dài > 20 ký tự
    if (text.length > 20) {
        console.log(`[Sentence Mode] Dịch câu dài: ${text.length} ký tự`);
        const googleTranslation = await googleTranslateService.translateText(text, 'ja', 'vi');

        return {
            success: true,
            original: text,
            hiragana: "", // Câu dài không cần hiragana
            translation: googleTranslation,
            english: "Google Translate",
            examples: [],
            source: "google"
        };
    }

    // 3. Chế độ Tra từ (Word Mode) - Text ngắn <= 20 ký tự
    const jishoResult = await jishoService.searchWord(text);

    // 3.1. Nếu Jisho KHÔNG tìm thấy -> Fallback sang Google Translate
    if (!jishoResult.success) {
        console.log(`[Fallback] Jisho không tìm thấy "${text}", dùng Google Translate`);

        const googleTranslation = await googleTranslateService.translateText(text, 'ja', 'vi');
        const hiragana = await kuroshiroService.toHiragana(text);

        return {
            success: true,
            original: text,
            hiragana: hiragana,
            translation: googleTranslation,
            english: "Google Translate",
            examples: [],
            source: "google"
        };
    }

    // 3.2. Nếu Jisho tìm thấy -> Xử lý kết quả

    // Dịch nghĩa tiếng Anh sang tiếng Việt
    const translatedMeanings = await Promise.all(
        jishoResult.meanings.map(m => googleTranslateService.translateText(m, 'en', 'vi'))
    );

    // Xử lý ví dụ (Examples)
    let processedExamples = [];

    if (jishoResult.examples && jishoResult.examples.length > 0) {
        // Dịch các ví dụ có sẵn từ Jisho
        for (const example of jishoResult.examples) {
            const vietnameseExample = await googleTranslateService.translateText(example.japanese, 'ja', 'vi');
            processedExamples.push({
                ...example,
                vietnamese: vietnameseExample
            });
        }
    } else {
        // Nếu không có ví dụ, tạo ví dụ mẫu (Auto-generate)
        processedExamples = await generateMockExamples(text, jishoResult.meanings[0]);
    }

    const result = {
        success: true,
        original: text,
        hiragana: jishoResult.hiragana,
        translation: translatedMeanings.join(", "),
        english: jishoResult.meanings.join(", "),
        examples: processedExamples,
        source: "jisho"
    };

    // Lưu vào cache
    dictionaryCache[text] = result;

    return result;
}

/**
 * Helper: Tạo ví dụ mẫu khi không có dữ liệu
 */
async function generateMockExamples(text, englishMeaning) {
    console.log(`[Auto-Gen] Tạo ví dụ mẫu cho "${text}"`);

    const isVerb = /[るうつくぐすぬむぶふ]$/.test(text);
    const isAdjective = /[いな]$/.test(text);

    let ex1 = "", ex2 = "";
    let en1 = "", en2 = "";

    if (isVerb) {
        ex1 = `${text}ことができます。`;
        ex2 = `${text}たいです。`;
        en1 = `I can ${englishMeaning}.`;
        en2 = `I want to ${englishMeaning}.`;
    } else if (isAdjective) {
        ex1 = `${text}です。`;
        ex2 = `${text}人です。`;
        en1 = `It is ${englishMeaning}.`;
        en2 = `A ${englishMeaning} person.`;
    } else {
        ex1 = `${text}は重要です。`;
        ex2 = `${text}を使います。`;
        en1 = `${englishMeaning} is important.`;
        en2 = `I use ${englishMeaning}.`;
    }

    const [vi1, vi2, html1, html2] = await Promise.all([
        googleTranslateService.translateText(ex1, 'ja', 'vi'),
        googleTranslateService.translateText(ex2, 'ja', 'vi'),
        kuroshiroService.addFurigana(ex1),
        kuroshiroService.addFurigana(ex2)
    ]);

    return [
        { japanese: ex1, english: en1, vietnamese: vi1, html: html1 },
        { japanese: ex2, english: en2, vietnamese: vi2, html: html2 }
    ];
}

module.exports = {
    translateJapanese
};
