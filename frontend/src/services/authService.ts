import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  username: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
}

const setAuthHeader = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/users/login`, credentials);
    const data = response.data;
    setAuthHeader(data.accessToken);
    return data;
  },

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/users/register`, credentials);
    const data = response.data;
    setAuthHeader(data.accessToken);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await axios.post(`${API_URL}/users/refresh`, { refreshToken });
    const data = response.data;
    setAuthHeader(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post(`${API_URL}/users/logout`, { refreshToken });
      }
    } finally {
      setAuthHeader(null);
    }
  }
};

export default authService;
