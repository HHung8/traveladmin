import { useCallback, useEffect, useState } from "react";
import { getPayment, getPayments, Payment, PaymentAction, PaymentDetail, runPaymentAction } from "../api/payments";
import { getErrorMessage } from "../utils/error";

export const PAYMENTS_PAGE_SIZE = 10;

export function usePayments(page: number) {
    const [items, setItems] = useState<Payment[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const reload = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getPayments({ page, pageSize: PAYMENTS_PAGE_SIZE });
            if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
            setItems(res.data.items ?? []);
            setTotal(res.data.totalCount ?? 0);
            setTotalPages(Math.max(1, res.data.totalPages ?? 1));
        } catch (err) {
            setError(getErrorMessage(err, "Không tải được danh sách giao dịch"));
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        reload();
    }, [reload])

    const getDetail = useCallback(async (id: string): Promise<PaymentDetail> => {
        const res = await getPayment(id);
        if (!res.success) throw new Error(res.message || "Không lấy được chi tiết");
        return res.data;
    }, []);

    const act = useCallback(
        async (id: string, action: PaymentAction) => {
            const res = await runPaymentAction(id, action);
            if (!res.success) throw new Error(res.message || "Thao tác thất bại");
            await reload();
        },
        [reload]
    );

    return {items, total, totalPages, loading, error, reload, getDetail, act};
}