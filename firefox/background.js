// Background script cho Firefox/Zen Browser
// Xử lý các sự kiện nền của extension

// Sử dụng browser API (Firefox) với fallback về chrome API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
    console.log('Japanese Translator Extension đã được cài đặt!');
});

// Lắng nghe messages từ content script hoặc popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate') {
        // Có thể xử lý thêm logic ở đây nếu cần
        sendResponse({ success: true });
    }
    return true;
});
