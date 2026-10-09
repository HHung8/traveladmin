import { useCallback, useEffect, useState } from "react";
import { createHotel, deleteHotel, getHotel, getHotels, Hotel, HotelCreatePayload, HotelDetail, HotelUpdatePayload, updateHotel, uploadHotelImage } from "../api/hotel";
import { getErrorMessage } from "../utils/error";
import { getDestinations } from "../api/destinations";

export const HOTELS_PAGE_SIZE = 10;

export interface DestinationOption {
    id: string;
    name: string;
}

export function useHotels(page: number) {
    const [items, setItems] = useState<Hotel[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [destinations, setDestinations] = useState<DestinationOption[]>([]);


    const reload = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getHotels({ page, pageSize: HOTELS_PAGE_SIZE });
            if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
            setItems(res.data.items ?? []);
            setTotal(res.data.totalCount ?? 0);
            setTotalPages(Math.max(1, res.data.totalPages ?? 1));
        } catch (err) {
            setError(getErrorMessage(err, "Không tải được danh sách khách sạn"));
        } finally {
            setLoading(false);
        }
    }, [page])

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getDestinations({ page: 1, pageSize: 100 });
                if (!cancelled && res.success) {
                    setDestinations((res.data?.items ?? []).map((d) => ({ id: d.id, name: d.name })));
                }
            } catch {
                /* dropdown trống nếu lỗi */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const getDetail = useCallback(async (id: string): Promise<HotelDetail> => {
        const res = await getHotel(id);
        if (!res.success) throw new Error(res.message || "Không lấy được chi tiết");
        return res.data;
    }, []);


    // Lỗi upload ảnh không throw để tránh tạo trùng bản ghi
    const uploadAfterSave = async (id: string, file?: File | null) => {
        if (!file) return undefined;
        try {
            const up = await uploadHotelImage(id, file);
            if (!up.success) throw new Error(up.message || "Upload ảnh thất bại");
        } catch (err) {
            return getErrorMessage(err, "Upload ảnh thất bại");
        }
        return undefined;
    };

    const create = useCallback(
        async (payload: HotelCreatePayload, file?: File | null) => {
            const res = await createHotel(payload);
            if (!res.success) throw new Error(res.message || "Tạo khách sạn thất bại");
            const imageError = await uploadAfterSave(res.data.id, file);
            await reload();
            return { id: res.data.id, imageError };
        },
        [reload]
    )


    const update = useCallback(
        async (id: string, payload: HotelUpdatePayload, file?: File | null) => {
            const res = await updateHotel(id, payload);
            if (!res.success) throw new Error(res.message || "Cập nhật thất bại");
            const imageError = await uploadAfterSave(id, file);
            await reload();
            return { id, imageError };
        },
        [reload]
    );

    const remove = useCallback(async (id: string) => {
        const res = await deleteHotel(id);
        if (!res.success) throw new Error(res.message || "Xóa thất bại");
        setItems((prev) => prev.filter((x) => x.id !== id));
        setTotal((t) => Math.max(0, t - 1));
    }, []);

    return {
        items, total, totalPages, loading, error, destinations,
        reload, getDetail, create, update, remove
    }

}