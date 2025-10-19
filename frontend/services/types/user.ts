// User types
export interface User {
  user_id: string;
  email: string;
  full_name: string;
  university: string;
  created_at: string;
  last_login: string;
}

// Token types
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Authentication response type
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: Tokens;
  };
}

// Registration data type
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  university: string;
}

// Login data type
export interface LoginData {
  email: string;
  password: string;
}

// Error response type
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
