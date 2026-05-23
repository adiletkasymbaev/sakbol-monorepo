import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type { LoginPostBody, RegisterPostBody, RegisterCreatedResponse, TokenResponse, VerifyEmailBody } from "../types/auth";
import api from "./axios";

export const authService = {
  register: (data: RegisterPostBody) => {
    return api.post<RegisterCreatedResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  verifyEmail: (data: VerifyEmailBody) => {
    return api.post<TokenResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, data);
  },

  login: (data: LoginPostBody) => {
    return api.post<TokenResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  },

};