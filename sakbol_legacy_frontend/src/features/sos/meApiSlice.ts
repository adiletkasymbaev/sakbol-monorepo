import { apiSlice } from "../../api/apiSlice";
import type { IUser } from "../../shared/types/user";

export const meApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<IUser, void>({
      query: () => "/auth/me/",
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetMeQuery } = meApiSlice;