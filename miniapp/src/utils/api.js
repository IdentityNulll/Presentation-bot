import axios from 'axios';

// Base URL for backend – can be overridden via environment variable
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic GET wrapper with error handling
 */
async function get(path) {
  const res = await axios.get(`${BASE_URL}${path}`);
  return res.data;
}

/**
 * Generic POST wrapper
 */
async function post(path, payload) {
  const res = await axios.post(`${BASE_URL}${path}`, payload);
  return res.data;
}

/**
 * Generic PATCH wrapper for updates
 */
async function patch(path, payload) {
  const res = await axios.patch(`${BASE_URL}${path}`, payload);
  return res.data;
}

export default {
  /** Fetch user's presentations */
  async getPresentations() {
    return await get('/presentations');
  },

  /** Fetch a single presentation by id */
  async getPresentation(id) {
    return await get(`/presentations/${id}`);
  },

  /** Create a new presentation */
  async createPresentation(data) {
    return await post('/presentations', data);
  },

  /** Update a presentation */
  async updatePresentation(id, data) {
    return await patch(`/presentations/${id}`, data);
  },

  /** Generate presentation via AI (used by wizard) */
  async generatePresentation(payload) {
    return await post('/presentations/generate', payload);
  },
};
