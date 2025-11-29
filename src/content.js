// Content script - Chạy trên mọi trang web
// Phát hiện khi người dùng bôi đen text tiếng Nhật

let selectedText = "";
let translationPopup = null;
let isSelecting = false; // Flag để biết đang trong quá trình select
let popupJustCreated = false; // Flag để biết popup vừa mới được tạo
let selectedRange = null; // Lưu range của text được chọn

// Hàm kiểm tra xem text có phải tiếng Nhật không
function isJapanese(text) {
  // Kiểm tra các ký tự Hiragana, Katakana, và Kanji
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}

// Hàm cập nhật vị trí popup
function updatePopupPosition() {
  if (!translationPopup || !selectedRange) return;

  // Đợi một chút để DOM render xong và lấy kích thước chính xác
  setTimeout(() => {
    if (!translationPopup || !selectedRange) return;

    // Sử dụng getClientRects để lấy vị trí chính xác của dòng cuối cùng (xử lý đa dòng)
    const rects = selectedRange.getClientRects();
    if (rects.length === 0) return;

    const rect = rects[rects.length - 1]; // Lấy rect của dòng cuối cùng
    const popupRect = translationPopup.getBoundingClientRect();

    // Kích thước popup
    const popupWidth = popupRect.width;
    const popupHeight = popupRect.height;

    // Sử dụng Visual Viewport API để xử lý zoom chính xác
    // Fallback về window.innerWidth/Height nếu Visual Viewport không có
    const viewport = window.visualViewport || {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetLeft: 0,
      offsetTop: 0,
      scale: 1
    };

    const viewportWidth = viewport.width;
    const viewportHeight = viewport.height;
    const viewportOffsetLeft = viewport.offsetLeft || 0;
    const viewportOffsetTop = viewport.offsetTop || 0;

    // Margin an toàn từ mép màn hình
    const SAFE_MARGIN = 15;

    // Tính toán vị trí (LUÔN LUÔN hiển thị bên phải text)
    let left = rect.right + 8; // Bên phải text 8px
    let top = rect.top; // Căn top với text

    // 1. Xử lý vị trí ngang (Horizontal) - LUÔN Ở BÊN PHẢI
    // Kiểm tra xem popup có bị tràn ra ngoài mép phải viewport không
    const rightEdge = left + popupWidth - viewportOffsetLeft;

    if (rightEdge > viewportWidth - SAFE_MARGIN) {
      // Nếu tràn ra ngoài mép phải, điều chỉnh left về sát mép phải
      // NHƯNG VẪN GIỮ BÊN PHẢI TEXT (không chuyển sang trái)
      left = viewportOffsetLeft + viewportWidth - popupWidth - SAFE_MARGIN;

      // Đảm bảo popup vẫn ở bên phải text, ít nhất một phần
      // Nếu left nhỏ hơn vị trí text, thì giữ ở ngay bên phải text
      if (left < rect.right) {
        left = rect.right + 8;
      }
    }

    // 2. Xử lý vị trí dọc (Vertical)
    const bottomEdge = top + popupHeight - viewportOffsetTop;

    // Nếu popup bị tràn xuống dưới màn hình
    if (bottomEdge > viewportHeight - SAFE_MARGIN) {
      // Đẩy lên trên text
      top = rect.top - popupHeight - 8;

      // Nếu vẫn bị tràn lên trên
      if (top - viewportOffsetTop < SAFE_MARGIN) {
        // Căn theo viewport bottom
        top = viewportOffsetTop + viewportHeight - popupHeight - SAFE_MARGIN;
      }
    }

    // Đảm bảo popup không vượt quá mép trên (final check)
    if (top < viewportOffsetTop + SAFE_MARGIN) {
      top = viewportOffsetTop + SAFE_MARGIN;
    }

    // Áp dụng vị trí FIXED
    translationPopup.style.position = "fixed";
    translationPopup.style.top = top + "px";
    translationPopup.style.left = left + "px";
    translationPopup.style.right = "auto";
    translationPopup.style.bottom = "auto";
  }, 0);
}

function createTranslationPopup(range, text) {
  // Xóa popup cũ nếu có
  if (translationPopup) {
    translationPopup.remove();
  }

  // Lưu range của text được chọn
  selectedRange = range;

  // Xác định xem có phải là câu không (dựa vào độ dài)
  const isSentence = text.length > 20;

  // Tạo popup mới
  translationPopup = document.createElement("div");
  translationPopup.id = "jp-translator-popup";

  // Thêm class nếu là câu
  if (isSentence) {
    translationPopup.classList.add("sentence-mode");
  }

  translationPopup.innerHTML = `
    <div class="jp-translator-content">
      <div class="jp-translator-loading">${isSentence ? "Đang dịch câu..." : "Đang tra từ..."
    }</div>
    </div>
  `;

  document.body.appendChild(translationPopup);

  // Thêm event listener cho resize và scroll để cập nhật vị trí
  window.addEventListener("resize", updatePopupPosition);
  window.addEventListener("scroll", updatePopupPosition);

  // Thêm event listener cho visualViewport để xử lý zoom
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updatePopupPosition);
    window.visualViewport.addEventListener("scroll", updatePopupPosition);
  }

  // Đợi popup render xong rồi mới tính toán vị trí
  updatePopupPosition();

  // Đánh dấu popup vừa mới được tạo
  popupJustCreated = true;
  setTimeout(() => {
    popupJustCreated = false;
  }, 500); // Sau 500ms mới cho phép xóa

  // Gọi API để dịch
  translateText(text);
}

// Hàm gọi API backend để dịch
async function translateText(text) {
  try {
    const response = await fetch(
      "https://jp-extension.vercel.app/api/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      }
    );

    const data = await response.json();

    if (data.success) {
      displayTranslation(
        data.translation,
        data.hiragana,
        data.original,
        data.examples || [], // Thêm examples
        data.source, // Thêm source
        data.english || "" // Thêm nghĩa tiếng Anh
      );
    } else {
      displayError(data.error || "Lỗi khi dịch");
    }
  } catch (error) {
    console.error("Lỗi:", error);
    displayError(
      "Không thể kết nối đến server. Hãy chắc chắn server đang chạy!"
    );
  }
}

// Hàm hiển thị kết quả dịch
function displayTranslation(
  translation,
  hiragana,
  original,
  examples = [],
  source = "",
  english = ""
) {
  if (!translationPopup) return;

  // Kiểm tra mode hiện tại của popup
  const isSentenceMode = translationPopup.classList.contains("sentence-mode");

  // Kiểm tra thêm source từ backend để chắc chắn
  const isGoogleTranslate =
    source === "google" || (examples.length === 0 && !hiragana);

  let contentHTML = "";

  if (isSentenceMode || isGoogleTranslate) {
    // CHẾ ĐỘ DỊCH CÂU: Chỉ hiển thị bản dịch
    // Đảm bảo popup có class sentence-mode
    if (!translationPopup.classList.contains("sentence-mode")) {
      translationPopup.classList.add("sentence-mode");
    }

    contentHTML = `
        <div class="jp-translator-sentence-label" style="font-size: 12px; color: #2196F3; margin-bottom: 4px; font-weight: bold;">Dịch câu:</div>
        <div class="jp-translator-translation">${translation}</div>
        <button class="jp-translator-close">×</button>
      `;
  } else {
    // CHẾ ĐỘ TRA TỪ: Hiển thị đầy đủ

    // Tạo HTML cho ví dụ (chỉ hiển thị 1 ví dụ đầu tiên)
    let examplesHTML = "";
    if (examples && examples.length > 0) {
      const example = examples[0]; // Chỉ lấy ví dụ đầu tiên
      const jpWithFurigana = example.html || example.japanese;
      examplesHTML = `
        <div class="jp-translator-examples-title">Ví dụ</div>
        <div class="jp-translator-example">
          <div class="jp-translator-example-jp">${jpWithFurigana}</div>
          ${example.vietnamese
          ? `<div class="jp-translator-example-vi">${example.vietnamese}</div>`
          : ""
        }
        </div>
      `;
    }

    // Tạo HTML cho hiragana với ghi chú
    let hiraganaHTML = "";
    if (hiragana) {
      hiraganaHTML = `
        <div class="jp-translator-hiragana">${hiragana}</div>
        ${english
          ? `<div class="jp-translator-hiragana-note">${english}</div>`
          : ""
        }
      `;
    }

    contentHTML = `
        <div class="jp-translator-word-section">
          <div class="jp-translator-word-left">
            <div class="jp-translator-original">${original}</div>
            ${hiraganaHTML}
          </div>
          <div class="jp-translator-word-right">
            <div class="jp-translator-translation"><span class="jp-translator-translation-label">Nghĩa:</span> ${translation}</div>
          </div>
        </div>
        ${examplesHTML
        ? `<div class="jp-translator-examples-container">${examplesHTML}</div>`
        : ""
      }
        <button class="jp-translator-close">×</button>
      `;
  }

  translationPopup.querySelector(".jp-translator-content").innerHTML =
    contentHTML;

  // Cập nhật lại vị trí sau khi content thay đổi (có thể thay đổi kích thước)
  // Đợi một chút để DOM render xong
  setTimeout(() => {
    updatePopupPosition();
  }, 50);

  // Thêm sự kiện đóng popup
  const closeBtn = translationPopup.querySelector(".jp-translator-close");
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Ngăn event bubble lên document
    if (translationPopup) {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updatePopupPosition);
        window.visualViewport.removeEventListener("scroll", updatePopupPosition);
      }
      translationPopup.remove();
      translationPopup = null;
      selectedRange = null;
    }
  });

  // Ngăn click vào popup bị xóa
  translationPopup.addEventListener("click", (e) => {
    e.stopPropagation(); // Ngăn event bubble lên document
  });
}

// Hàm hiển thị lỗi
function displayError(errorMessage) {
  if (!translationPopup) return;

  translationPopup.querySelector(".jp-translator-content").innerHTML = `
    <div class="jp-translator-error">${errorMessage}</div>
    <button class="jp-translator-close">×</button>
  `;

  const closeBtn = translationPopup.querySelector(".jp-translator-close");
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Ngăn event bubble lên document
    if (translationPopup) {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updatePopupPosition);
        window.visualViewport.removeEventListener("scroll", updatePopupPosition);
      }
      translationPopup.remove();
      translationPopup = null;
      selectedRange = null;
    }
  });

  // Ngăn click vào popup bị xóa
  translationPopup.addEventListener("click", (e) => {
    e.stopPropagation(); // Ngăn event bubble lên document
  });
}

// Lắng nghe sự kiện khi người dùng bắt đầu bôi đen
document.addEventListener("mousedown", function () {
  isSelecting = true;
});

// Lắng nghe sự kiện khi người dùng bôi đen text
document.addEventListener("mouseup", function (e) {
  // Đợi một chút để selection hoàn tất
  setTimeout(() => {
    isSelecting = false;
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Kiểm tra nếu có text được chọn và là tiếng Nhật
    if (text && isJapanese(text)) {
      try {
        const range = selection.getRangeAt(0);

        // Tạo popup với range của text được chọn
        createTranslationPopup(range, text);
      } catch (error) {
        // Nếu không có range, tạo rect giả từ vị trí chuột
        const fakeRect = {
          left: e.clientX - 50,
          top: e.clientY,
          width: 100,
          height: 20,
          bottom: e.clientY + 20,
        };
        // Tạo range giả từ fakeRect (nhưng khó, có lẽ bỏ qua hoặc xử lý khác)
        // Vì không có range, không tạo popup
      }
    } else {
      // Nếu không phải tiếng Nhật, xóa popup cũ
      if (translationPopup) {
        translationPopup.remove();
        translationPopup = null;
      }
    }
  }, 100); // Delay nhỏ để tránh conflict với click event
});

// Xóa popup khi click ra ngoài (nhưng không phải khi đang select hoặc vừa tạo)
document.addEventListener("click", function (e) {
  // Không xóa nếu:
  // 1. Đang trong quá trình select
  // 2. Popup vừa mới được tạo (< 500ms)
  // 3. Click vào chính popup
  if (
    !isSelecting &&
    !popupJustCreated &&
    translationPopup &&
    !translationPopup.contains(e.target)
  ) {
    window.removeEventListener("resize", updatePopupPosition);
    window.removeEventListener("scroll", updatePopupPosition);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", updatePopupPosition);
      window.visualViewport.removeEventListener("scroll", updatePopupPosition);
    }
    translationPopup.remove();
    translationPopup = null;
    selectedRange = null;
  }
});
