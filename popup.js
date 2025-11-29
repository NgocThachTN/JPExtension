// Popup script - Kiểm tra kết nối với server

document.addEventListener('DOMContentLoaded', function () {
  const statusDiv = document.getElementById('status');
  const testBtn = document.getElementById('testBtn');

  // Kiểm tra kết nối khi mở popup
  checkConnection();

  // Test kết nối khi click button
  testBtn.addEventListener('click', function () {
    checkConnection();
  });

  // Hàm cập nhật status với text
  function updateStatus(text, className) {
    statusDiv.textContent = text;
    statusDiv.className = `status ${className}`;
  }

  // Hàm kiểm tra kết nối với server
  async function checkConnection() {
    // Disable button khi đang kiểm tra
    testBtn.disabled = true;
    testBtn.querySelector('.button-text').textContent = 'Đang kiểm tra...';

    updateStatus('Đang kiểm tra kết nối...', 'checking');

    try {
      const response = await fetch('https://jp-extension.vercel.app/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        updateStatus('Đã kết nối với server', 'connected');
      } else {
        throw new Error('Server không phản hồi');
      }
    } catch (error) {
      updateStatus('Không thể kết nối đến server', 'disconnected');
    } finally {
      // Enable button sau khi kiểm tra xong
      testBtn.disabled = false;
      testBtn.querySelector('.button-text').textContent = 'Test kết nối Server';
    }
  }
});

