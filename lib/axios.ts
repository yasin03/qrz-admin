import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Özel hata sınıfı
export class ApiClientError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

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
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // window.location.href = "/login";
      }
    }

    // Backend'den gelen mesajı yakala (kendi API response formatınıza göre uyarlayın)
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Beklenmeyen bir hata oluştu.";

    const status = error.response?.status;
    const code = error.response?.data?.code;

    return Promise.reject(new ApiClientError(message, status, code));
  },
);

export default axiosInstance;
export const api = axiosInstance;