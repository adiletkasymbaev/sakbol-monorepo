import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type { AvatarUpdatePostBody, Profile } from "../types/auth";
import api from "./axios";

export const profileService = {
  getMe: () => {
    return api.get<Profile>(API_ENDPOINTS.PROFILE.ME);
  },

  updateMe: (data: Partial<Profile>) => {
    return api.patch<Profile>(API_ENDPOINTS.PROFILE.ME, data);
  },

  reqPasswordChange: (new_password: string) => {
    return api.post(API_ENDPOINTS.SECURITY.PASSWORD_REQ, { new_password });
  },

  verifyPasswordChange: (code: string) => {
    return api.post(API_ENDPOINTS.SECURITY.PASSWORD_VERIFY, { code });
  },

  reqEmailChange: (new_email: string) => {
    return api.post(API_ENDPOINTS.SECURITY.EMAIL_REQ, { new_email });
  },

  verifyEmailChange: (code: string) => {
    return api.post(API_ENDPOINTS.SECURITY.EMAIL_VERIFY, { code });
  },

  updateAvatar: (data: AvatarUpdatePostBody) => {
    const formData = new FormData();
    formData.append("user_id", data.user_id.toString());
    formData.append("avatar", data.avatar);

    return api.post<Profile>(API_ENDPOINTS.PROFILE.AVATAR, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};