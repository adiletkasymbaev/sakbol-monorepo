import axios from "axios";

// export const baseURL = "https://sakbolbrat.pythonanywhere.com"
// export const baseURL = "http://127.0.0.1:8000"
export const baseURL = "http://127.0.0.1:9000"

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

export default api;