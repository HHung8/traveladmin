import { api } from "./client";
import type { ApiResponse } from "./destinations";

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    actionUrl: string | null;
    metadata: unknown;
    createdAt: string;
}

export interface PagedNotifications {
    items: AppNotification[];
    totalCount: number;
    unreadCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const getNotifications = async (params?: { page?: number; pageSize?: number }) => {
    const res = await api.get<ApiResponse<PagedNotifications>>("/api/notifications", {
        params: { Page: params?.page, PageSize: params?.pageSize },
    });
    return res.data;
};

export const markNotificationRead = async (id: string) => {
    const res = await api.put<ApiResponse<unknown>>(`/api/notifications/${id}/read`);
    return res.data;
}


export const markAllNotificationsRead = async () => {
    const res = await api.put<ApiResponse<unknown>>("/api/notifications/read-all");
    return res.data;
}

export const deleteNotification = async (id: string) => {
    const res = await api.delete<ApiResponse<unknown>>(`/api/notifications/${id}`);
    return res.data;
};