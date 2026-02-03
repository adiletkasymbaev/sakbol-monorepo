import { apiSlice } from "../../api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔹 Авторизация
    login: builder.mutation({
      query: (credentials) => ({
        url: "/token/", // твой endpoint из Django urls.py
        method: "POST",
        body: { ...credentials },
      }),
    }),

    // 🔹 Регистрация
    register: builder.mutation({
      query: (userData) => ({
        url: "/register/",
        method: "POST",
        body: { ...userData },
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApiSlice;