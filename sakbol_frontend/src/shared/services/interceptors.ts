import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import api from "./axios";
import useAuth from "../../store/useAuth";
import UrlNames from "../enums/UrlNames";

// отдельный axios ТОЛЬКО для refresh (без интерсепторов)
const refreshApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: (api.defaults as any)?.withCredentials,
});

let isRefreshing = false;
let failedQueue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
  for (const cb of failedQueue) cb(token);
  failedQueue = [];
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function hardRedirectToLogin() {
  // чтобы гарантированно перекинуло даже если роуты/RequireAuth не оборачивают страницу
  window.location.replace(`/${UrlNames.LOGIN}`);
}

export const setupAuthInterceptor = () => {
  // защита от повторной установки (HMR/вызов в нескольких местах)
  if ((api.defaults as any).__authInterceptorInstalled) return;
  (api.defaults as any).__authInterceptorInstalled = true;

  /* ================= REQUEST ================= */
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const access = useAuth.getState().tokenAccess;

      config.headers = config.headers ?? {};

      // ВАЖНО: не добавляем Authorization на refresh endpoint
      const url = config.url ?? "";
      if (url.includes("/auth/refresh")) {
        delete (config.headers as any).Authorization;
        return config;
      }

      if (access) {
        (config.headers as any).Authorization = `Bearer ${access}`;
      } else {
        delete (config.headers as any).Authorization;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  /* ================= RESPONSE ================= */
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (!error.config) return Promise.reject(error);

      const originalRequest = error.config as RetryConfig;
      const status = error.response?.status;

      // если не 401 — не трогаем
      if (status !== 401) return Promise.reject(error);

      const url = originalRequest.url ?? "";

      // НЕ пытаемся рефрешить запросы аутентификации (login, register)
      // Если логин/регистрация вернули 401 — это нормальная ошибка, а не истокший токен
      if (url.includes("/accounts/login") || url.includes("/accounts/register")) {
        return Promise.reject(error);
      }

      // уже ретраили — не зацикливаем
      if (originalRequest._retry) return Promise.reject(error);
      originalRequest._retry = true;

      const { tokenRefresh: refresh, setTokenPair, logout } = useAuth.getState();

      // нет refresh — выходим
      if (!refresh) {
        logout();
        hardRedirectToLogin();
        return Promise.reject(error);
      }

      // если это сам refresh endpoint — не пытаемся рефрешить рефреш
      if (url.includes("/accounts/refresh")) {
        logout();
        hardRedirectToLogin();
        return Promise.reject(error);
      }

      // если refresh уже идет — ставим в очередь
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push((token) => {
            if (!token) return reject(error);

            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as any).Authorization = `Bearer ${token}`;

            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // refresh БЕЗ Authorization, БЕЗ интерсепторов
        const res = await refreshApi.post("/auth/refresh/", { refresh });

        const newAccess = (res.data as any)?.access as string | undefined;
        const newRefresh = (res.data as any)?.refresh as string | undefined; // если rotation

        if (!newAccess) {
          processQueue(null);
          logout();
          hardRedirectToLogin();
          return Promise.reject(error);
        }

        setTokenPair(newAccess, newRefresh ?? refresh);
        processQueue(newAccess);

        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (e) {
        processQueue(null);
        logout();
        hardRedirectToLogin();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
  );
};