import axios from "axios";

export const baseURL = "http://127.0.0.1:8000"
// export const baseURL = "https://sakbol.app"

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 15000,
});

export default api;