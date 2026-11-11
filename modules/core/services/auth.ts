import axios from "@/lib/axios";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  type?: string;
  message?: string;
  user?: {
    id: string;
    name: string;
    username: string;
  };
  [key: string]: unknown;
}

export const login = async (data: LoginRequest) => {
  const response = await axios.post<LoginResponse>("/api/auth", data);
  return response.data;
};

export const logout = async () => {
  await axios.post("/api/auth/logout");
};
