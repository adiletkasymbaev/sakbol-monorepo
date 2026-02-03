import { apiSlice } from "../../api/apiSlice";

export const locationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📍 Обновить местоположение пользователя
    updateLocation: builder.mutation<void, { latitude: number; longitude: number }>({
      query: (body) => ({
        url: "/location/update/",
        method: "POST",
        body,
      }),
    }),

    // 🧭 Получить текущее местоположение пользователя
    getUserLocation: builder.query<
      { latitude: number; longitude: number; updated_at: string },
      void
    >({
      query: () => "/location/me/",
      providesTags: ["Location"],
    }),

    // 💡 (опционально) обновить онлайн-статус
    updateOnlineStatus: builder.mutation<void, { is_online: boolean }>({
      query: (body) => ({
        url: "auth/update-status/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useUpdateLocationMutation,
  useGetUserLocationQuery,
  useUpdateOnlineStatusMutation,
} = locationApiSlice;