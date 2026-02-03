import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
} from "@reduxjs/toolkit/query/react"
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import type { RootState } from "./store"
import { setCredentials, logOut } from "../features/auth/authSlice"

const baseQuery = fetchBaseQuery({
  baseUrl: "https://sakbol.app/api",
  // baseUrl: "http://127.0.0.1:8000/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    // пытаемся обновить токен через refresh
    const refreshToken = (api.getState() as RootState).auth.refreshToken
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: "/token/refresh/",
          method: "POST",
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult.data && typeof refreshResult.data === "object" && "access" in refreshResult.data) {
        // обновляем accessToken в store
        api.dispatch(
          setCredentials({
            accessToken: refreshResult.data.access as string,
          })
        )

        // повторяем исходный запрос с новым токеном
        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logOut())
      }
    } else {
      api.dispatch(logOut())
    }
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Contacts", "Favorites", "Users", "Auth", "Keywords", "Location", "SosSignal"],
  endpoints: () => ({}),
})