import { api } from "./client";
import type { ApiResponse } from "./destinations";

export type ReviewTargetType = "tour" | "hotel" | "attraction";

// ===== Kiểu dữ liệu =====
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Các field chung của một đánh giá (dùng cho giao diện hiển thị)
export interface ReviewSummary {
  id: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string; // ISO
  targetType: string;
  userName?: string;
  avatarUrl?: string | null;
  targetTitle?: string;
  thumbnailUrl?: string | null;
}

// GET /api/reviews/{targetType}/{targetId}
export interface Review extends ReviewSummary {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  targetId: string;
}

// GET /api/reviews/mine (không có userName, có tên và ảnh của đối tượng được đánh giá)
export interface MyReview extends ReviewSummary {
  targetId: string;
  targetTitle: string;
  thumbnailUrl: string | null;
}

// GET /api/reviews/detail/{id}: có thêm danh sách ảnh (cấu trúc từng ảnh chưa rõ nên để unknown)
export interface ReviewDetail extends Review {
  images: unknown[];
}

// ===== Gọi API =====
// Swagger đặt tên tham số phân trang là Page / PageSize
const toParams = (p?: { page?: number; pageSize?: number }) => ({
  Page: p?.page,
  PageSize: p?.pageSize,
});

// Đánh giá của một tour / khách sạn / điểm tham quan cụ thể
export const getReviewsByTarget = async (
  targetType: ReviewTargetType,
  targetId: string,
  params?: { page?: number; pageSize?: number }
) => {
  const res = await api.get<ApiResponse<PagedResult<Review>>>(
    `/api/reviews/${targetType}/${targetId}`,
    { params: toParams(params) }
  );
  return res.data;
};

export const getReview = async (id: string) => {
  const res = await api.get<ApiResponse<ReviewDetail>>(`/api/reviews/detail/${id}`);
  return res.data;
};

// Đánh giá của tài khoản đang đăng nhập
export const getMyReviews = async (params?: { page?: number; pageSize?: number }) => {
  const res = await api.get<ApiResponse<PagedResult<MyReview>>>("/api/reviews/mine", {
    params: toParams(params),
  });
  return res.data;
};

export const deleteReview = async (id: string) => {
  const res = await api.delete<ApiResponse<unknown>>(`/api/reviews/${id}`);
  return res.data;
};

export const deleteReviewImage = async (imageId: string) => {
  const res = await api.delete<ApiResponse<unknown>>(`/api/reviews/images/${imageId}`);
  return res.data;
};