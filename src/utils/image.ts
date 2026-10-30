const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:5167").replace(/\/$/, "");

export const resolveImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};