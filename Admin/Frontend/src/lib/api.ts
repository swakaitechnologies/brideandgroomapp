import axios from "axios";

// Production URL
const api = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_URL || "https://3m30rsqcgj.execute-api.us-east-1.amazonaws.com/api/admin",
  withCredentials: true,
});

// Development URL
// const api = axios.create({
//   baseURL: import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5001/api/admin",
//   withCredentials: true,
// });

let csrfToken: string | null = null;

// Request interceptor: attach token and CSRF token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  if (csrfToken && config.method && !["get", "head", "options"].includes(config.method)) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const newCsrfToken = response.headers["x-csrf-token"] || response.headers["X-CSRF-Token"];
    if (newCsrfToken) csrfToken = newCsrfToken;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && error.response?.data?.message?.includes("CSRF") && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      await api.get("/health");
      if (csrfToken) originalRequest.headers["X-CSRF-Token"] = csrfToken;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default api;





