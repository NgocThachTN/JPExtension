// Popup script - Kiểm tra kết nối với server

document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const testBtn = document.getElementById('testBtn');

  // Kiểm tra kết nối khi mở popup
  checkConnection();

  // Test kết nối khi click button
  testBtn.addEventListener('click', function() {
    checkConnection();
  });

  // Hàm kiểm tra kết nối với server
  async function checkConnection() {
    statusDiv.textContent = 'Đang kiểm tra...';
    statusDiv.className = 'status';

    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        statusDiv.textContent = '✓ Đã kết nối với server';
        statusDiv.className = 'status connected';
      } else {
        throw new Error('Server không phản hồi');
      }
    } catch (error) {
      statusDiv.textContent = '✗ Không thể kết nối. Hãy chạy: npm start';
      statusDiv.className = 'status disconnected';
    }
  }
});

