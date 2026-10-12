import { api } from "./client";
import type { ApiResponse } from "./destinations";

// ===== Kiểu dữ liệu =====
export interface PagedAttractions {
  items: Attraction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Item trong danh sách (GET /api/attractions) và chi tiết (GET /api/attractions/{id})
export interface Attraction {
  id: string;
  destinationId: string;
  destinationName: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  openingHours: string;
  entryFee: number;
  website: string;
}

// GET /api/attractions/destinations/{id} không trả destinationId / destinationName
export type AttractionBrief = Omit<Attraction, "destinationId" | "destinationName"> &
  Partial<Pick<Attraction, "destinationId" | "destinationName">>;

export interface AttractionSchedule {
  id: string;
  attractionId: string;
  visitDate: string; // ISO
  availableSlots: number;
  overridePrice: number | null;
}

// Body POST /api/attractions (thumbnailUrl là đường dẫn ảnh, không upload file)
export interface AttractionCreatePayload {
  destinationId: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  entryFee: number;
  website: string;
}

// Body PUT /api/attractions/{id} (không có destinationId)
export type AttractionUpdatePayload = Omit<AttractionCreatePayload, "destinationId">;

// Body POST /api/attraction-schedules
export interface AttractionSchedulePayload {
  attractionId: string;
  visitDate: string; // ISO
  availableSlots: number;
  overridePrice: number | null;
}

// ===== Địa điểm tham quan =====
export const getAttractions = async (params?: { page?: number; pageSize?: number }) => {
  const res = await api.get<ApiResponse<PagedAttractions>>("/api/attractions", { params });
  return res.data;
};

export const getAttractionsByDestination = async (destinationId: string) => {
  const res = await api.get<ApiResponse<AttractionBrief[]>>(
    `/api/attractions/destinations/${destinationId}`
  );
  return res.data;
};

export const getAttraction = async (id: string) => {
  const res = await api.get<ApiResponse<Attraction>>(`/api/attractions/${id}`);
  return res.data;
};

export const createAttraction = async (payload: AttractionCreatePayload) => {
  const res = await api.post<ApiResponse<Attraction>>("/api/attractions", payload);
  return res.data;
};

export const updateAttraction = async (id: string, payload: AttractionUpdatePayload) => {
  const res = await api.put<ApiResponse<Attraction>>(`/api/attractions/${id}`, payload);
  return res.data;
};

export const deleteAttraction = async (id: string) => {
  const res = await api.delete<ApiResponse<unknown>>(`/api/attractions/${id}`);
  return res.data;
};

// ===== Lịch tham quan =====
export const getAttractionSchedules = async (attractionId: string) => {
  const res = await api.get<ApiResponse<AttractionSchedule[]>>(
    `/api/attractions/${attractionId}/schedules`
  );
  return res.data;
};

export const createAttractionSchedule = async (payload: AttractionSchedulePayload) => {
  const res = await api.post<ApiResponse<AttractionSchedule>>("/api/attraction-schedules", payload);
  return res.data;
};

export const deleteAttractionSchedule = async (id: string) => {
  const res = await api.delete<ApiResponse<unknown>>(`/api/attraction-schedules/${id}`);
  return res.data;
};