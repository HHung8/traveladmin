import { use, useCallback, useEffect, useState } from "react";
import { deletePaymentMethod, getPaymentMethods, PaymentMethod, setDefaultPaymentMethod } from "../api/payments";
import { getErrorMessage } from "../utils/error";

export function usePaymentMethods() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError("");
        try {
            const res = await getPaymentMethods();
            if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
            setMethods(
                [...(res.data ?? [])].sort(
                    (a, b) => Number(b.isDefault) - Number(a.isDefault) ||
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
            );
        } catch (err) {
            setError(getErrorMessage(err, "Không tải được danh sách thẻ"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const setDefault = useCallback(
        async (id: string) => {
            const res = await setDefaultPaymentMethod(id);
            if (!res.success) throw new Error(res.message || "Đặt mặc định thất bại");
            await load(true);
        },
        [load]
    );

    const remove = useCallback(
        async (id: string) => {
            const res = await deletePaymentMethod(id);
            if (!res.success) throw new Error(res.message || "Xóa thẻ thất bại");
            await load(true);
        },
        [load]
    );
    
    return {methods, loading, error, reload: () => load(), setDefault, remove};
}