import { api } from "./client";
import { ApiResponse } from "./destinations";

export interface PagedTours {
    items: Tour[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface Tour {
    id: string;
    title: string;
    description: string;
    price: number;
    discountPrice: number | null;
    durationDays: number;
    maxCapacity: number;
    difficulty: string;
    thumbnailUrl: string | null;
    averageRating: number | null;
    reviewCount: number;
    destinationId: string;
    destinationName: string;
}

export interface TourSchedule {
  id: string;
  tourId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  availableSlots: number;
  overridePrice: number | null;
}
 
export interface TourDetail extends Tour {
  highlights: string;
  includes: string;
  excludes: string;
  images: unknown[];
  schedules: TourSchedule[];
}

export interface TourCreatePayload {
  destinationId: string;
  title: string;
  description: string;
  highlights: string;
  includes: string;
  excludes: string;
  price: number;
  discountPrice: number;
  durationDays: number;
  maxCapacity: number;
  difficulty: string;
}

export type TourUpdatePayload = Omit<TourCreatePayload, "destinationId"> & {
    isActive: boolean;
};

export interface SchedulePayload {
    startDate: string;
    endDate:string;
    availableSlots:number;
    overridePrice: number | null;
}

// ===== Tour =====
export const getTours = async (params?: { page?: number; pageSize?: number }) => {
  const res = await api.get<ApiResponse<PagedTours>>("/api/tours", { params });
  return res.data;
};
 
export const getToursByDestination = async (destinationId: string) => {
  const res = await api.get<ApiResponse<Tour[]>>(`/api/tours/by-destination/${destinationId}`);
  return res.data;
};
 
export const getTour = async (id: string) => {
  const res = await api.get<ApiResponse<TourDetail>>(`/api/tours/${id}`);
  return res.data;
};
 
export const createTour = async (payload: TourCreatePayload) => {
  const res = await api.post<ApiResponse<Tour>>("/api/tours", payload);
  return res.data;
};
 
export const updateTour = async (id: string, payload: TourUpdatePayload) => {
  const res = await api.put<ApiResponse<Tour>>(`/api/tours/${id}`, payload);
  return res.data;
};
 
// Giả định: DELETE /api/tours/{id}
export const deleteTour = async (id: string) => {
  const res = await api.delete<ApiResponse<unknown>>(`/api/tours/${id}`);
  return res.data;
};
 
// Giả định: POST /api/tours/{id}/images, field "file". Sai thì chỉ cần sửa trong hàm này.
export const uploadTourImage = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiResponse<unknown>>(`/api/tours/${id}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
 
// ===== Lịch khởi hành =====
export const getTourSchedules = async (tourId: string) => {
  const res = await api.get<ApiResponse<TourSchedule[]>>(`/api/tours/${tourId}/schedules`);
  return res.data;
};
 
export const createTourSchedule = async (tourId: string, payload: SchedulePayload) => {
  const res = await api.post<ApiResponse<TourSchedule>>(`/api/tours/${tourId}/schedules`, payload);
  return res.data;
};
 