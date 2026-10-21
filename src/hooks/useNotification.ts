import { use, useCallback, useEffect, useState } from "react";
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from "../api/notification";
import { getErrorMessage } from "../utils/error";

export const NOTIFICATIONS_PAGE_SIZE = 20;

export function useNotifications(page: number) {
    const [items, setItems] = useState<AppNotification[]>([]);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            setError("");
            try {
                const res = await getNotifications({ page, pageSize: NOTIFICATIONS_PAGE_SIZE });
                if (!res.success) throw new Error(res.message || "Không tải được thông báo");
                setItems(res.data.items ?? []);
                setTotal(res.data.totalCount ?? 0);
                setUnreadCount(res.data.unreadCount ?? 0);
                setTotalPages(Math.max(1, res.data.totalPages ?? 1));
            } catch (error) {
                setError(getErrorMessage(error, "Không tải được thông báo"))
            } finally {
                setLoading(false);
            }
        }, [page]
    )

    useEffect(() => {
        load();
    }, [load]);

    // Đánh dấu một thông báo đã đọc, cập nhật tại chỗ để không phải tải lại cả danh sách
    const markRead = useCallback(async (id: string) => {
        const res = await markNotificationRead(id);
        if (!res.success) throw new Error(res.message || "Thao tác thất bại");
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((u) => Math.max(0, u - 1));
    }, []);

    // Đánh dấu tất cả đã đọc, xong tải lại ngầm để đồng bộ với server
    const markAllRead = useCallback(async () => {
        const res = await markAllNotificationsRead();
        if (!res.success) throw new Error(res.message || "Thao tác thất bại");
        await load(true);
    }, [load]);

    const remove = useCallback(async (n: AppNotification) => {
        const res = await deleteNotification(n.id);
        if (!res.success) throw new Error(res.message || "Xóa thông báo thất bại");
        setItems((prev) => prev.filter((x) => x.id !== n.id));
        setTotal((t) => Math.max(0, t - 1));
        if (!n.isRead) setUnreadCount((u) => Math.max(0, u - 1));
    }, []);

    return {
        items, total, unreadCount, totalPages, loading, error,
        reload: () => load(), markRead, markAllRead, remove,
    };

}