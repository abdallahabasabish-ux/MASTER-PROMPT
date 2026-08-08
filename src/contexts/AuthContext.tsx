import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));

  useEffect(() => {
    // التحقق من التوكن عند تحميل التطبيق
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      // يمكن جلب بيانات المستخدم
    }
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const res = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
    const { accessToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
    setAccessToken(accessToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    // جلب بيانات المستخدم
  };

  const register = async (data: any) => {
    await axios.post('/api/auth/register', data);
    // يمكن توجيه إلى صفحة تسجيل الدخول
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    delete axios.defaults.headers.common['Authorization'];
    axios.post('/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
