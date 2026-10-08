import { useCallback, useEffect, useState } from "react";
import { createTour, deleteTour, getTour, getTours, getToursByDestination, Tour, TourCreatePayload, TourDetail, TourUpdatePayload, updateTour, uploadTourImage } from "../api/tour";
import { getErrorMessage } from "../utils/error";
import { getDestinations } from "../api/destinations";

export const TOURS_PAGE_SIZE = 10;

export interface DestinationOption {
    id: string;
    name: string;
}

interface Options {
    page: number;
    destinationId: string;
}

export function useTours({ page, destinationId }: Options) {
    const [items, setItems] = useState<Tour[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [destinations, setDestinations] = useState<DestinationOption[]>([]);

    const reload = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            if (destinationId) {
                const res = await getToursByDestination(destinationId)
                if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
                const list = res.data ?? [];
                setItems(list);
                setTotal(list.length);
                setTotalPages(1);
            } else {
                const res = await getTours({ page, pageSize: TOURS_PAGE_SIZE });
                if (!res.success) throw new Error(res.message || 'Không tải được dữ liệu');
                setItems(res.data.items ?? []);
                setTotal(res.data.totalCount ?? 0);
                setTotalPages(Math.max(1, res.data.totalPages ?? 1));
            }
        } catch (error) {
            setError(getErrorMessage(error, "Không tải được danh sách tour"))
        } finally {
            setLoading(false);
        }
    }, [page, destinationId]);

    useEffect(() => {
        reload();
    }, [reload])

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getDestinations({ page: 1, pageSize: 100 });
                if (!cancelled && res.success) {
                    setDestinations((res.data?.items ?? []).map((d) => ({ id: d.id, name: d.name })));
                }
            } catch {
                /* dropdown trống nếu lỗi; danh sách tour vẫn dùng được */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const getDetail = useCallback(async (id: string): Promise<TourDetail> => {
        const res = await getTour(id);
        if (!res.success) throw new Error(res.message || "Không lấy được chi tiết");
        return res.data;
    }, []);

    const uploadAfterSave = async (id: string, file?: File | null) => {
        if (!file) return undefined;
        try {
            const up = await uploadTourImage(id, file);
            if (!up.success) throw new Error(up.message || "Upload ảnh thất bại");
        } catch (error) {
            return getErrorMessage(error, "Upload ảnh thất bại");
        };
        return undefined;
    }


    const create = useCallback(
        async (payload: TourCreatePayload, file?: File | null) => {
            const res = await createTour(payload);
            if (!res.success) throw new Error(res.message || "Tạo tour thất bại");
            const imageError = await uploadAfterSave(res.data.id, file);
            await reload();
            return { id: res.data.id, imageError };
        },
        [reload]
    );



    const update = useCallback(
        async (id: string, payload: TourUpdatePayload, file?: File | null) => {
            const res = await updateTour(id, payload);
            if (!res.success) throw new Error(res.message || "Cập nhật thất bại");
            const imageError = await uploadAfterSave(id, file);
            await reload();
            return { id, imageError };
        },
        [reload]
    );

    const remove = useCallback(async (id: string) => {
        const res = await deleteTour(id);
        if (!res.success) throw new Error(res.message || "Xóa thất bại");
        setItems((prev) => prev.filter((x) => x.id !== id));
        setTotal((t) => Math.max(0, t - 1));
    }, []);

    return {items, total, totalPages, loading, error, destinations, reload, getDetail, create, update, remove};

}