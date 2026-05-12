import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// In development, use your machine's local IP address instead of localhost
// Your local IP (from expo start) is 192.168.1.4
const BASE_URL = "http://192.168.1.4:5000/api"; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Mobile-App": "true", // Skips CSRF on backend
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Token Refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        }, {
          headers: { "X-Mobile-App": "true" }
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        await SecureStore.setItemAsync("accessToken", newAccessToken);
        await SecureStore.setItemAsync("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Log out user if refresh fails
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const getProfile = () => api.get("/profile");
export const getDailyPicks = () => api.get("/profile/daily-picks");
export const getAllProfiles = () => api.get("/profile/all");
export const getProfileViewers = () => api.get("/profile/viewers");
export const updateProfile = (data: any) => api.put("/profile", data);
export const requestMobileChange = (data: { newMobile: string; reason: string }) => api.post("/profile/request-mobile-change", data);

// Photos API
export const getPhotos = () => api.get("/photos");
export const uploadPhotos = (formData: FormData) => api.post("/photos/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const deletePhoto = (id: string) => api.delete(`/photos/${id}`);
export const setPrimaryPhoto = (id: string) => api.put(`/photos/${id}/primary`);

// Privacy API
export const getPrivacySettings = () => api.get("/privacy");
export const updatePrivacySettings = (data: any) => api.post("/privacy", data);

// Banners API
export const getBanners = () => api.get("/banners");

export default api;
