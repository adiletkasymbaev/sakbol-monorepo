import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type { AvatarUpdatePostBody, Profile } from "../types/auth";
import api from "./axios";

export const profileService = {
  getMe: () => {
    return api.get<Profile>(API_ENDPOINTS.PROFILE.ME);
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