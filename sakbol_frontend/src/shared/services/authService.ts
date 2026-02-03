import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type { LoginPostBody, RegisterPostBody, RegisterResponse } from "../types/auth";
import api from "./axios";

export const authService = {
  register: (data: RegisterPostBody) => {
    return api.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  login: (data: LoginPostBody) => {
    return api.post<RegisterResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  },

  refresh: (refreshToken: string) => {
    return api.post<{ access: string }>(API_ENDPOINTS.AUTH.REFRESH, { refresh: refreshToken });
  },
};