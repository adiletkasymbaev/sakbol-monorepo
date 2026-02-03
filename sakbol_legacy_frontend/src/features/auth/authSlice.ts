import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
// Селекторы
import type { RootState } from "../../api/store"
export const selectAccessToken = (state: RootState) => state.auth.accessToken
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
}

const initialState: AuthState = {
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string }>
    ) => {
      state.accessToken = action.payload.accessToken
      if (action.payload.refreshToken) state.refreshToken = action.payload.refreshToken

      localStorage.setItem("accessToken", action.payload.accessToken)
      if (action.payload.refreshToken)
        localStorage.setItem("refreshToken", action.payload.refreshToken)
    },
    logOut: (state) => {
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    },
  },
})

export const { setCredentials, logOut } = authSlice.actions
export default authSlice.reducer