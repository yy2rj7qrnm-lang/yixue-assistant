import axios from 'axios';

// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// 接口定义
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  grade: string;
  subject: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      grade?: string;
      subject?: string;
    };
  };
  message?: string;
}

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // 重定向到登录页面
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证服务
export const authService = {
  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);

      // 保存token和用户信息
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem(
          'user_info',
          JSON.stringify(response.data.data.user)
        );
      }

      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  /**
   * 用户注册
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', credentials);

      // 注册成功后保存用户信息但不自动登录
      if (response.data.success) {
        localStorage.setItem(
          'user_info',
          JSON.stringify(response.data.data.user)
        );
      }

      return response.data;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 更新用户信息
   */
  async updateProfile(profileData: any): Promise<any> {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 刷新token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await api.post<AuthResponse>('/auth/refresh-token', {
        refresh_token: refreshToken,
      });

      // 保存新的token
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('刷新token失败:', error);
      throw error;
    }
  },

  /**
   * 重置密码
   */
  async resetPassword(email: string): Promise<any> {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      console.error('重置密码失败:', error);
      throw error;
    }
  },

  /**
   * 验证token是否有效
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await api.get('/auth/validate');
      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  /**
   * 检查用户是否已登录
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * 获取存储的用户信息
   */
  getUserInfo(): any {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  /**
   * 清除所有认证信息
   */
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },
};

// 导出api实例供其他服务使用
export { api };