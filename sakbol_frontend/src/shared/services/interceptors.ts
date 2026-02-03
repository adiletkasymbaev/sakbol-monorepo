import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import api from "./axios";
import { authService } from "./authService";
import useAuth from "../../store/useAuth";

let isRefreshing = false;
let failedQueue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
  failedQueue.forEach((cb) => cb(token));
  failedQueue = [];
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const setupAuthInterceptor = () => {
  /* ================= REQUEST ================= */
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { tokenAccess: access } = useAuth.getState();

      if (access) {
        config.headers.Authorization = `Bearer ${access}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  /* ================= RESPONSE ================= */
  api.interceptors.response.use(
    (response: AxiosResponse) => response,

    async (error: AxiosError) => {
      const originalRequest = error.config as RetryConfig;

      if (
        error.response?.status !== 401 ||
        originalRequest._retry
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const { tokenRefresh: refresh, setTokenPair, logout } =
        useAuth.getState();

      if (!refresh) {
        logout();
        return Promise.reject(error);
      }

      /* === если уже идёт refresh — ждём === */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }

            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await authService.refresh(refresh);
        const newAccess = response.data.access;

        setTokenPair(newAccess, refresh);
        processQueue(newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(null);
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};