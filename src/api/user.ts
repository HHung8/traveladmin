import { api } from "./client";
import type { ApiResponse } from "./destinations";

export interface UserListItem {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string
}

export interface PagedUsers {
    items: UserListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages?: number;
}

export interface MyProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
}


export interface UpdateProfilePayload {
    fullName: string;
    phoneNumber: string;
}

export interface UserFilters {
    keyword?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}


export const getUsers = async (filters: UserFilters = {}) => {
    const res = await api.get<ApiResponse<PagedUsers>>("/api/users", {
        params: {
            keyword: filters.keyword || undefined,
            Role: filters.role || undefined,
            IsActive: filters.isActive,
            Page: filters.page,
            PageSize: filters.pageSize,
        },
    });
    return res.data;
};

export const getMyProfile = async () => {
    const res = await api.get<ApiResponse<MyProfile>>("/api/users/me");
    return res.data;
};

export const updateMyProfile = async (payload: UpdateProfilePayload) => {
    const res = await api.put<ApiResponse<unknown>>("/api/users/me", payload);
    return res.data;
}

export const uploadMyAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse<unknown>>("/api/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}