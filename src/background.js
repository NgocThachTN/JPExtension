// Background service worker
// Xử lý các sự kiện nền của extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Japanese Translator Extension đã được cài đặt!');
});

// Lắng nghe messages từ content script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    // Có thể xử lý thêm logic ở đây nếu cần
    sendResponse({ success: true });
  }
  return true;
});

