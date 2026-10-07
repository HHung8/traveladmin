import axios from 'axios'

const API_URL = "http://0.0.0.0:5167";
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

api.interceptors.request.use((config) => {
  const accessToken =
    localStorage.getItem("accessToken") || import.meta.env.VITE_DEV_TOKEN;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
},
  (error) => Promise.reject(error)
);