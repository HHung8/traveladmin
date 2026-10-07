import {api} from "./client"

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  role: "user" | "admin";
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthData;
  errors: string[] | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

// LOGIN
export const loginApi = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/api/auth/login",
    data
  );

  return response.data;
};

// REGISTER
export const registerApi = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/api/auth/register",
    data
  );

  return response.data;
};

// REFRESH TOKEN
export const refreshTokenApi = async (
  refreshToken: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/api/auth/refresh",
    refreshToken,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// LOGOUT
export const logoutApi = async () => {
  const response = await api.post("/api/auth/logout");

  return response.data;
};