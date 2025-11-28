// Node.js Backend Server
// Xử lý API dịch tiếng Nhật sang tiếng Việt
// Sử dụng Jisho.org API (miễn phí) để tra từ điển tự động

const express = require("express");
const cors = require("cors");
const JishoAPI = require("unofficial-jisho-api");
const app = express();
const PORT = 3000;

// Khởi tạo Jisho API client
const jisho = new JishoAPI();

// Middleware
app.use(cors()); // Cho phép Chrome extension gọi API
app.use(express.json()); // Parse JSON body

// Dictionary cache - lưu các từ đã tra để tăng tốc độ
const dictionaryCache = {};

// Hàm gọi Jisho.org API để tra từ điển
async function searchJisho(text) {
  try {
    const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(
      text
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const firstResult = data.data[0];
      const japanese = firstResult.japanese[0];

      // Lấy hiragana/reading
      let hiragana = "";
      if (japanese.reading) {
        hiragana = japanese.reading;
      } else if (
        japanese.word &&
        /[\u3040-\u309F\u30A0-\u30FF]/.test(japanese.word)
      ) {
        hiragana = japanese.word;
      }

      // Lấy nghĩa tiếng Anh
      let meanings = [];
      let examples = [];

      if (firstResult.senses && firstResult.senses.length > 0) {
        const firstSense = firstResult.senses[0];
        meanings = firstSense.english_definitions || [];
      }

      // Gọi API examples từ unofficial-jisho-api
      try {
        const examplesData = await jisho.searchForExamples(text);

        if (examplesData.results && examplesData.results.length > 0) {
          // Lấy tối đa 2 ví dụ đầu tiên
          examples = examplesData.results
            .slice(0, 2)
            .map((result) => {
              // unofficial-jisho-api trả về: kanji, kana, english
              return {
                japanese: result.kanji || result.kana || "",
                english: result.english || "",
              };
            })
            .filter((ex) => ex.japanese); // Lọc bỏ những ví dụ không có Japanese text
        }
      } catch (err) {
        // Nếu không lấy được examples, sẽ tạo ví dụ mẫu sau
        // Không log để tránh spam console
      }

      return {
        success: true,
        hiragana: hiragana || text,
        meanings: meanings,
        word: japanese.word || text,
        examples: examples, // Thêm examples
      };
    }

    return { success: false };
  } catch (error) {
    console.error("Lỗi khi gọi Jisho API:", error);
    return { success: false, error: error.message };
  }
}

// Hàm dịch tiếng Anh sang tiếng Việt bằng Google Translate (miễn phí)
async function translateToVietnamese(text) {
  try {
    // Sử dụng Google Translate API miễn phí (không cần key)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0] && data[0][0]) {
      return data[0][0][0];
    }
    return text; // Nếu không dịch được, trả về text gốc
  } catch (error) {
    console.error("Lỗi khi dịch sang tiếng Việt:", error);
    return text; // Trả về text gốc nếu lỗi
  }
}

// Hàm xử lý dịch chính
async function translateJapanese(text) {
  // Kiểm tra cache trước
  if (dictionaryCache[text]) {
    return dictionaryCache[text];
  }

  // Gọi Jisho API để tra từ điển
  const jishoResult = await searchJisho(text);

  if (!jishoResult.success) {
    // Nếu Jisho không tìm thấy, thử kiểm tra xem có phải hiragana/katakana không
    const hiraganaRegex = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
    if (hiraganaRegex.test(text)) {
      // Nếu là hiragana/katakana thuần, trả về chính nó
      return {
        success: false,
        original: text,
        hiragana: text,
        translation: "Không tìm thấy trong từ điển",
        error: "Từ này không có trong Jisho dictionary",
      };
    }

    return {
      success: false,
      original: text,
      hiragana: text,
      translation: "Không tìm thấy",
      error: "Không tìm thấy trong từ điển Jisho",
    };
  }

  // Lấy nghĩa tiếng Anh
  if (jishoResult.meanings.length === 0) {
    return {
      success: false,
      original: text,
      hiragana: jishoResult.hiragana,
      translation: "Không có nghĩa",
      error: "Không tìm thấy nghĩa trong từ điển",
    };
  }

  // Dịch tất cả nghĩa sang tiếng Việt
  const translatedMeanings = await Promise.all(
    jishoResult.meanings.map((m) => translateToVietnamese(m))
  );
  const allMeanings = translatedMeanings.join(", ");

  // Xử lý ví dụ cách dùng từ
  let processedExamples = [];

  // Nếu Jisho có examples, dùng nó (ưu tiên)
  if (jishoResult.examples && jishoResult.examples.length > 0) {
    console.log(
      `Tìm thấy ${jishoResult.examples.length} ví dụ từ Jisho cho từ "${text}"`
    );
    for (const example of jishoResult.examples) {
      let japaneseExample = example.japanese || "";
      let englishExample = example.english || "";

      // Nếu không có japanese, thử lấy từ các field khác
      if (!japaneseExample && example.kanji) {
        japaneseExample = example.kanji;
      }
      if (!japaneseExample && example.kana) {
        japaneseExample = example.kana;
      }

      const vietnameseExample = englishExample
        ? await translateToVietnamese(englishExample)
        : "";

      if (japaneseExample) {
        processedExamples.push({
          japanese: japaneseExample,
          english: englishExample,
          vietnamese: vietnameseExample,
        });
      }
    }
  }

  // Chỉ tạo ví dụ mẫu nếu không có examples từ Jisho
  if (processedExamples.length === 0) {
    console.log(`Không có ví dụ từ Jisho, tạo ví dụ mẫu cho từ "${text}"`);
    // Tạo ví dụ mẫu dựa trên từ và nghĩa
    const firstMeaning = jishoResult.meanings[0] || "";
    const vietnameseMeaning = await translateToVietnamese(firstMeaning);

    // Tạo ví dụ phù hợp với loại từ
    // Kiểm tra xem từ có kết thúc bằng động từ không (る, う, etc.)
    const isVerb = /[るうつくぐすぬむぶふ]$/.test(text);
    // Kiểm tra tính từ (い, な)
    const isAdjective = /[いな]$/.test(text);

    let example1 = "";
    let example2 = "";
    let english1 = "";
    let english2 = "";

    if (isVerb) {
      // Động từ
      example1 = `${text}ことができます。`; // "Có thể [động từ]"
      example2 = `${text}たいです。`; // "Muốn [động từ]"
      english1 = `I can ${firstMeaning}.`;
      english2 = `I want to ${firstMeaning}.`;
    } else if (isAdjective) {
      // Tính từ
      example1 = `${text}です。`; // "[Tính từ]"
      example2 = `${text}人です。`; // "Người [tính từ]"
      english1 = `It is ${firstMeaning}.`;
      english2 = `A ${firstMeaning} person.`;
    } else {
      // Danh từ hoặc từ khác
      example1 = `${text}は重要です。`; // "[Từ] là quan trọng"
      example2 = `${text}を使います。`; // "Sử dụng [từ]"
      english1 = `${firstMeaning} is important.`;
      english2 = `I use ${firstMeaning}.`;
    }

    // Dịch ví dụ sang tiếng Việt
    const vietnamese1 = await translateToVietnamese(english1);
    const vietnamese2 = await translateToVietnamese(english2);

    processedExamples.push(
      {
        japanese: example1,
        english: english1,
        vietnamese: vietnamese1,
      },
      {
        japanese: example2,
        english: english2,
        vietnamese: vietnamese2,
      }
    );
  }

  const result = {
    success: true,
    original: text,
    hiragana: jishoResult.hiragana,
    translation: allMeanings,
    english: jishoResult.meanings.join(", "), // Giữ lại tiếng Anh để tham khảo
    examples: processedExamples, // Thêm examples đã xử lý
  };

  // Lưu vào cache
  dictionaryCache[text] = result;

  return result;
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server đang hoạt động!",
    timestamp: new Date().toISOString(),
  });
});

// API Translate
app.post("/api/translate", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.json({
        success: false,
        error: "Vui lòng nhập text cần dịch",
      });
    }

    const trimmedText = text.trim();

    // Gọi hàm dịch tự động từ Jisho API
    const result = await translateJapanese(trimmedText);

    res.json(result);
  } catch (error) {
    console.error("Lỗi khi dịch:", error);
    res.json({
      success: false,
      error: "Lỗi server: " + error.message,
      original: req.body.text || "",
      hiragana: "",
      translation: "",
    });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(` Server đang chạy tại http://localhost:${PORT}`);
  console.log(` API Health: http://localhost:${PORT}/api/health`);
  console.log(`API Translate: http://localhost:${PORT}/api/translate`);
  console.log(" Hướng dẫn:");
  console.log("1. Load extension vào Chrome (chrome://extensions)");
  console.log("2. Bôi đen text tiếng Nhật trên bất kỳ trang web nào");
  console.log("3. Popup sẽ hiển thị bản dịch và hiragana!\n");
});
