import axios from "axios";
import useAuth from "../../store/useAuth";

// export const baseURL = "http://127.0.0.1:8000"
// export const baseURL = "http://127.0.0.1:9000"
export const baseURL = "https://sakbol.app"

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Добавляем Authorization header для всех запросов
api.interceptors.request.use((config) => {
  const token = useAuth.getState().tokenAccess;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;