// Content script - Chạy trên mọi trang web
// Phát hiện khi người dùng bôi đen text tiếng Nhật

let selectedText = "";
let translationPopup = null;
let isSelecting = false; // Flag để biết đang trong quá trình select
let popupJustCreated = false; // Flag để biết popup vừa mới được tạo
let selectedRange = null; // Lưu range của text được chọn để tính lại vị trí
let debounceTimer = null; // Timer cho debounce scroll/resize

// Hàm debounce để tránh gọi updatePopupPosition quá nhiều lần
function debouncedUpdatePopupPosition() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updatePopupPosition, 16); // ~60fps
}

// Hàm kiểm tra xem text có phải tiếng Nhật không
function isJapanese(text) {
  // Kiểm tra các ký tự Hiragana, Katakana, và Kanji
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}

// Hàm cập nhật vị trí popup
function updatePopupPosition() {
  if (!translationPopup || !selectedRange) return;

  // Đợi một chút để DOM render xong
  setTimeout(() => {
    if (!translationPopup || !selectedRange) return;

    // Tính lại rect của text từ range hiện tại
    const currentTextRect = selectedRange.getBoundingClientRect();

    const popupRect = translationPopup.getBoundingClientRect();
    const popupWidth = popupRect.width || 300;
    const popupHeight = popupRect.height || 200;

    // Tính toán vị trí popup (theo viewport)
    // Popup nằm ngay bên phải của text, hơi phía trên một chút
    const textRightX = currentTextRect.right; // Bên phải của text
    const textTopY = currentTextRect.top;
    const textCenterY = currentTextRect.top + currentTextRect.height / 2;

    // Đặt popup ngay sát bên phải của text (đẩy sang trái 10px để gần hơn)
    let left = textRightX - 80; // Đẩy sang trái 10px để popup gần text hơn
    // Đặt popup hơi phía trên một chút so với giữa text
    let top = textCenterY - popupHeight / 2 - 10; // Căn giữa theo Y nhưng hơi lên trên 10px

    // Nếu popup quá cao so với text, căn theo top của text
    if (top < textTopY - 20) {
      top = textTopY - 10; // Đặt phía trên text một chút
    }

    // Nếu popup quá thấp, căn theo bottom của text
    if (top + popupHeight > currentTextRect.bottom + 20) {
      top = currentTextRect.bottom - popupHeight + 10; // Đặt phía dưới text một chút
    }

    // Đảm bảo popup không ra ngoài màn hình bên phải
    const windowWidth = window.innerWidth;
    if (left + popupWidth > windowWidth - 10) {
      // Nếu không đủ chỗ bên phải, đặt bên trái text
      left = currentTextRect.left - popupWidth - 10;
      // Nếu vẫn không đủ chỗ bên trái, đặt sát mép màn hình
      if (left < 10) {
        left = 10;
      }
    }

    // Đảm bảo popup không ra ngoài màn hình bên trái
    if (left < 10) {
      left = 10;
    }

    // Đảm bảo popup không ra ngoài màn hình phía trên
    if (top < 10) {
      top = 10;
    }

    // Đảm bảo popup không ra ngoài màn hình phía dưới
    const viewportHeight = window.innerHeight;
    if (top + popupHeight > viewportHeight - 10) {
      // Nếu không đủ chỗ phía dưới, đặt phía trên (có thể che text một chút)
      top = textTopY - popupHeight - 10;
      if (top < 10) {
        top = 10;
      }
    }

    // Chuyển từ viewport coordinates sang fixed coordinates
    translationPopup.style.left = left + "px";
    translationPopup.style.top = top + "px";
    translationPopup.style.position = "fixed";
  }, 50);
}

// Hàm tạo popup hiển thị translation
function createTranslationPopup(range, text) {
  // Xóa popup cũ nếu có
  if (translationPopup) {
    translationPopup.remove();
  }

  // Lưu range của text được chọn
  selectedRange = range;

  // Tạo popup mới
  translationPopup = document.createElement("div");
  translationPopup.id = "jp-translator-popup";
  translationPopup.innerHTML = `
    <div class="jp-translator-content">
      <div class="jp-translator-loading">Đang dịch...</div>
    </div>
  `;

  document.body.appendChild(translationPopup);

  // Thêm event listener cho scroll và resize để cập nhật vị trí
  window.addEventListener('scroll', debouncedUpdatePopupPosition);
  window.addEventListener('resize', debouncedUpdatePopupPosition);

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
    const response = await fetch("https://jpextension.onrender.com/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    const data = await response.json();

    if (data.success) {
      displayTranslation(
        data.translation,
        data.hiragana,
        data.original,
        data.examples || [] // Thêm examples
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
function displayTranslation(translation, hiragana, original, examples = []) {
  if (!translationPopup) return;

  // Tạo HTML cho ví dụ
  let examplesHTML = "";
  if (examples && examples.length > 0) {
    examplesHTML = '<div class="jp-translator-examples-title">📝 Ví dụ:</div>';
    examples.forEach((example) => {
      // Sử dụng HTML đã được tạo từ backend (có Furigana chuẩn) hoặc fallback về text gốc
      const jpWithFurigana = example.html || example.japanese;
      examplesHTML += `
        <div class="jp-translator-example">
          <div class="jp-translator-example-jp">${jpWithFurigana}</div>
          ${example.vietnamese
          ? `<div class="jp-translator-example-vi">${example.vietnamese}</div>`
          : ""
        }
        </div>
      `;
    });
  }

  translationPopup.querySelector(".jp-translator-content").innerHTML = `
    <div class="jp-translator-original">${original}</div>
    ${hiragana ? `<div class="jp-translator-hiragana">${hiragana}</div>` : ""}
    <div class="jp-translator-translation">${translation}</div>
    ${examplesHTML}
    <button class="jp-translator-close">×</button>
  `;

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
      window.removeEventListener('scroll', debouncedUpdatePopupPosition);
      window.removeEventListener('resize', debouncedUpdatePopupPosition);
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
      window.removeEventListener('scroll', debouncedUpdatePopupPosition);
      window.removeEventListener('resize', debouncedUpdatePopupPosition);
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
    window.removeEventListener('scroll', debouncedUpdatePopupPosition);
    window.removeEventListener('resize', debouncedUpdatePopupPosition);
    translationPopup.remove();
    translationPopup = null;
    selectedRange = null;
  }
});
