/**
 * Application Configuration
 * Resolves the backend API base URL from Vite environment variables with local fallback.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Strip any trailing slashes
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

// Ensure standard /api route namespace prefix is present
export const API_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

export default {
  API_BASE_URL,
  API_URL,
};
