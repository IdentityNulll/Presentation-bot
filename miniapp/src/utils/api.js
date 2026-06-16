import axios from "axios";
import { getTelegramUser } from "./telegram";

// Base URL for backend – can be overridden via environment variable
const BASE_URL = import.meta.env.VITE_API_URL || "/api/miniapp";

// Create axios instance with base URL and default headers
const axiosInstance = axios.create({
  baseURL: `https://presentation-bot-production-a425.up.railway.app/api/miniapp/`,
});

// Attach Telegram user info headers if available
axiosInstance.interceptors.request.use((config) => {
  const user = getTelegramUser();
  if (user && user.id) {
    config.headers["X-Telegram-Id"] = user.id;
    if (user.username) config.headers["X-Telegram-Username"] = user.username;
    if (user.first_name)
      config.headers["X-Telegram-First-Name"] = user.first_name;
    if (user.last_name) config.headers["X-Telegram-Last-Name"] = user.last_name;
  }
  return config;
});

/**
 * Generic GET wrapper with error handling
 */
async function get(path) {
  const res = await axiosInstance.get(`${path}`);
  return res.data;
}

/**
 * Generic POST wrapper
 */
async function post(path, payload) {
  const res = await axiosInstance.post(`${path}`, payload);
  return res.data;
}

/**
 * Generic PATCH wrapper for updates
 */
async function patch(path, payload) {
  const res = await axiosInstance.patch(`${path}`, payload);
  return res.data;
}

export default {
  /** Fetch user's presentations */
  async getPresentations() {
    return await get("/presentations");
  },

  /** Fetch a single presentation by id */
  async getPresentation(id) {
    return await get(`/presentations/${id}`);
  },

  /** Create a new presentation */
  async createPresentation(data) {
    return await post("/presentations", data);
  },

  /** Update a presentation */
  async updatePresentation(id, data) {
    return await patch(`/presentations/${id}`, data);
  },

  /** Generate presentation via AI (used by wizard) */
  async generatePresentation(payload) {
    return await post("/presentations/generate", payload);
  },
};
