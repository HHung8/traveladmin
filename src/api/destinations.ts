import { api } from "./client";

// ===== Kiểu dữ liệu =====
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[] | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount?: number;
}

// Item trong danh sách (GET /destinations)
export interface Destination {
  id: string;
  name: string;
  country: string;
  city: string;
  description: string;
  thumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  isFeatured: boolean;
  tourCount: number;
  hotelCount: number;
}

// Chi tiết (GET /destinations/{id}) có thêm climate, bestTimeToVisit
export interface DestinationDetail {
  id: string;
  name: string;
  country: string;
  city: string;
  description: string;
  thumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  climate: string;
  bestTimeToVisit: string;
  isFeatured: boolean;
  images: unknown[];
}

// Body cho POST / PUT
export interface DestinationPayload {
  name: string;
  country: string;
  city: string;
  description: string;
  latitude: number;
  longitude: number;
  climate: string;
  bestTimeToVisit: string;
  isFeatured: boolean;
}

// ===== Gọi API (trả về body: { success, message, data, errors }) =====
export const getDestinations = async () => {
  const res = await api.get<ApiResponse<PagedResult<Destination>>>("/api/destinations");
  return res.data;
};

export const getDestination = async (id: string) => {
  const res = await api.get<ApiResponse<DestinationDetail>>(`/api/destinations/${id}`);
  return res.data;
};

export const createDestination = async (payload: DestinationPayload) => {
  const res = await api.post<ApiResponse<Destination>>("/api/destinations", payload);
  return res.data;
};

export const updateDestination = async (id: string, payload: DestinationPayload) => {
  const res = await api.put<ApiResponse<Destination>>(`/api/destinations/${id}`, payload);
  return res.data;
};

export const deleteDestination = async (id: string) => {
  const res = await api.delete<ApiResponse<unknown>>(`/api/destinations/${id}`);
  return res.data;
};