import axios from 'axios';
import { toast } from 'react-toastify';

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

const clearAuthAndRedirect = (redirectTo = null) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  const currentPath = redirectTo || window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/setup') {
    window.location.href = `/login?redirect_to=${encodeURIComponent(currentPath)}`;
  } else {
    window.location.href = '/login';
  }
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      if (isTokenExpired(token)) {
        clearAuthAndRedirect();
        return Promise.reject(new Error('Token expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    toast.error('حدث خطأ في إعداد الطلب');
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }
    
    if (error.response?.status === 403) {
      toast.error('ليس لديك صلاحية للوصول إلى هذا المورد');
    } else if (error.response?.status === 404) {
      toast.error('المورد المطلوب غير موجود');
    } else if (error.response?.status >= 500) {
      toast.error('خطأ في الخادم، يرجى المحاولة لاحقاً');
    } else if (error.message === 'Network Error') {
      toast.error('خطأ في الاتصال بالشبكة، يرجى التحقق من اتصالك بالإنترنت');
    } else if (!error.response) {
      toast.error('فشل الاتصال بالخادم');
    }
    
    return Promise.reject(error);
  }
);

export default api;
