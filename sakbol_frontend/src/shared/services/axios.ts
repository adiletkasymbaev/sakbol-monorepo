import axios from "axios";

export const baseURL = "https://sakbolbrat.pythonanywhere.com"

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

export default api;