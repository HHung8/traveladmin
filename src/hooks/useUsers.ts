import { useCallback, useEffect, useState } from "react";
import { getUsers, UserListItem } from "../api/user";
import { getErrorMessage } from "../utils/error";

export const USERS_PAGE_SIZE = 10;

interface Options {
    page: number;
    keyword: string;
    role: string;
    isActive: "" | "true" | "false"
}

export function useUsers({ page, keyword, role, isActive }: Options) {
    const [items, setItems] = useState<UserListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getUsers({
                keyword: keyword.trim(),
                role,
                isActive: isActive === "" ? undefined : isActive === "true",
                page,
                pageSize: USERS_PAGE_SIZE,
            });
            if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
            const count = res.data.totalCount ?? 0;
            setItems(res.data.items ?? []);
            setTotal(count);
            setTotalPages(Math.max(1, res.data.totalPages ?? Math.ceil(count / (res.data.pageSize || USERS_PAGE_SIZE))))
        } catch (error) {
            setError(getErrorMessage(error, "Không tải được danh sách người dùng"));
        } finally {
            setLoading(false);
        }
    }, [page, keyword, role, isActive])

    useEffect(() => {
        reload();
    }, [reload])

    return {items, total, totalPages, loading, error, reload}
}