import { apiSlice } from "../../api/apiSlice"
import type { FavoriteContactsResponse } from "../../shared/types/favorites"

export const favoritesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Получить список избранных
    getFavorites: builder.query<FavoriteContactsResponse, void>({
      query: () => "/favorites/",
      providesTags: ["Favorites"],
    }),

    // Добавить в избранное
    addFavorite: builder.mutation({
      query: (contactId: number) => ({
        url: "/favorites/",
        method: "POST",
        body: { contact_id: contactId },
      }),
      invalidatesTags: ["Favorites"],
    }),

    // Удалить из избранных
    deleteFavorite: builder.mutation({
      query: (favoriteId: number) => ({
        url: `/favorites/${favoriteId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Favorites"],
    }),
  }),
})

export const {
  useGetFavoritesQuery,
  useAddFavoriteMutation,
  useDeleteFavoriteMutation,
} = favoritesApiSlice