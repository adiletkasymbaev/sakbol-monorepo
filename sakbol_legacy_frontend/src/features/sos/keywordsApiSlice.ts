import { apiSlice } from "../../api/apiSlice";
import type { Keyword } from "../../shared/types/keywords";

export const keywordsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Получить все ключевые слова пользователя
    getKeywords: builder.query<Keyword[], void>({
      query: () => "/keywords/",
      providesTags: ["Keywords"],
    }),

    // Создать новое ключевое слово
    addKeyword: builder.mutation<Keyword, { word: string }>({
      query: (data) => ({
        url: "/keywords/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Keywords"],
    }),

    // Обновить ключевое слово
    updateKeyword: builder.mutation<Keyword, { id: number; word: string }>({
      query: ({ id, word }) => ({
        url: `/keywords/${id}/`,
        method: "PUT",
        body: { word },
      }),
      invalidatesTags: ["Keywords"],
    }),

    // Удалить ключевое слово
    deleteKeyword: builder.mutation<{ detail: string }, number>({
      query: (id) => ({
        url: `/keywords/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Keywords"],
    }),
  }),
});

export const {
  useGetKeywordsQuery,
  useAddKeywordMutation,
  useUpdateKeywordMutation,
  useDeleteKeywordMutation,
} = keywordsApiSlice;