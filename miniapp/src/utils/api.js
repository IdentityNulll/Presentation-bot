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

/**
 * Generic PUT wrapper
 */
async function put(path, payload) {
  const res = await axiosInstance.put(`${path}`, payload);
  return res.data;
}

/**
 * Generic DELETE wrapper
 */
async function del(path) {
  const res = await axiosInstance.delete(`${path}`);
  return res.data;
}

export default {
  /** Get current user details from DB */
  async getUserInfo() {
    return await get("/me");
  },

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
    return await put(`/presentations/${id}`, data);
  },

  /** Generate presentation via AI (used by wizard) */
  async generatePresentation(payload) {
    return await post("/presentations/generate", payload);
  },

  /** Add a slide */
  async addSlide(id) {
    return await post(`/presentations/${id}/slides`);
  },

  /** Update a slide */
  async updateSlide(id, slideId, data) {
    return await put(`/presentations/${id}/slides/${slideId}`, data);
  },

  /** Delete a slide */
  async deleteSlide(id, slideId) {
    return await del(`/presentations/${id}/slides/${slideId}`);
  },

  /** Duplicate a slide */
  async duplicateSlide(id, slideId) {
    return await post(`/presentations/${id}/slides/${slideId}/duplicate`);
  },

  /** Reorder slides */
  async reorderSlides(id, slideIds) {
    return await post(`/presentations/${id}/slides/reorder`, { slideIds });
  },

  /** Regenerate a slide using AI */
  async regenerateSlide(id, slideId) {
    return await post(`/presentations/${id}/slides/${slideId}/regenerate`);
  },

  /** Search/suggest stock images */
  async suggestImages(query) {
    return await get(`/images/suggest?query=${encodeURIComponent(query)}`);
  },

  /** Upload an image */
  async uploadImage(id, file) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await axiosInstance.post(`/presentations/${id}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  /** Confirm style selection and request payment link via bot */
  async selectStyle(id, style) {
    return await post(`/presentations/${id}/select-style`, { style });
  },
};
