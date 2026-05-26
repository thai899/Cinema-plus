import axios from 'axios';

// Khởi tạo instance của axios kết nối đến cổng chạy của Spring Boot (Backend)
const axiosClient = axios.create({
  baseURL: 'http://localhost:8081/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cấu hình interceptor: Tự động đính kèm Token JWT vào Header trước khi gửi request lên Backend
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Lấy token lưu trong bộ nhớ trình duyệt
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Gắn chuỗi Bearer Token hợp lệ
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;