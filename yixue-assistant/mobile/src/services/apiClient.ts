import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__
  ? 'http://localhost:8000/api'
  : 'https://api.yixue-assistant.com/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get token from storage:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token过期，清除本地存储
          try {
            await AsyncStorage.multiRemove(['token', 'user']);
          } catch (err) {
            console.error('Failed to clear storage:', err);
          }
        }

        // 统一错误处理
        const errorMessage =
          (error.response?.data as any)?.message ||
          (error.response?.data as any)?.error ||
          error.message ||
          '请求失败，请稍后重试';

        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  get<T = any>(url: string, params?: any) {
    return this.client.get<T>(url, { params });
  }

  post<T = any>(url: string, data?: any) {
    return this.client.post<T>(url, data);
  }

  put<T = any>(url: string, data?: any) {
    return this.client.put<T>(url, data);
  }

  delete<T = any>(url: string) {
    return this.client.delete<T>(url);
  }

  // 文件上传
  upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void) {
    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

export default new ApiClient();
