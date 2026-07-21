import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// İstek interceptor'ı
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Yanıt interceptor'ı
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Örneğin 401 olduğunda login sayfasına yönlendirebilirsin
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
