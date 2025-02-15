/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import authService from "../services/authService";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshTokenFn = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem("accessToken", response.accessToken);
      return response;
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      throw error;
    }
  }, []);

  const setupAxiosInterceptors = useCallback(() => {
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => {
                const token = localStorage.getItem("accessToken");
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axios(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const response = await refreshTokenFn();
            processQueue();
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }, [refreshTokenFn]);

  const validateTokenAndGetUser = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");
      
      if (!accessToken || !savedUser) {
        setLoading(false);
        return;
      }

      // Try to refresh the token to ensure it's valid
      try {
        await refreshTokenFn();
        // If refresh successful, keep the current user
        setUser(JSON.parse(savedUser));
      } catch (error) {
        // If refresh fails, clear everything
        setUser(null);
        localStorage.removeItem("user");
      }
    } finally {
      setLoading(false);
    }
  }, [refreshTokenFn]);

  useEffect(() => {
    setupAxiosInterceptors();
    validateTokenAndGetUser();
  }, [setupAxiosInterceptors, validateTokenAndGetUser]);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    const response = await authService.register({ username, email, password });
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
