import { useCallback, useEffect, useMemo, useState } from "react";
import { Attraction, AttractionBrief, AttractionCreatePayload, AttractionUpdatePayload, createAttraction, deleteAttraction, getAttractions, getAttractionsByDestination, updateAttraction } from "../api/attractions";
import { getErrorMessage } from "../utils/error";
import { getDestinations } from "../api/destinations";


export const ATTRACTIONS_PAGE_SIZE = 10;
export interface DestinationOption {
    id: string;
    name: string;
}

interface Options {
    page: number;
    destinationId: string; // "" = tất cả
}


export function useAttractions({ page, destinationId }: Options) {
    const [rawItems, setRawItems] = useState<AttractionBrief[]>([]);
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
                const res = await getAttractionsByDestination(destinationId);
                if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
                const list = res.data ?? [];
                setRawItems(list);
                setTotal(list.length);
                setTotalPages(1);
            } else {
                const res = await getAttractions({ page, pageSize: ATTRACTIONS_PAGE_SIZE });
                if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
                setRawItems(res.data.items ?? []);
                setTotal(res.data.totalCount ?? 0);
                setTotalPages(Math.max(1, res.data.totalPages ?? 1));
            }
        } catch (err) {
            setError(getErrorMessage(err, "Không tải được danh sách điểm tham quan"));
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
                /* dropdown trống nếu lỗi */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const items: Attraction[] = useMemo(() => {
        const name = destinations.find((d) => d.id === destinationId)?.name ?? "";
        return rawItems.map((a) => ({
            ...a,
            destinationId: a.destinationId ?? destinationId,
            destinationName: a.destinationId ?? name,
        }))
    }, [rawItems, destinations, destinationId])


    const create = useCallback(
        async (payload: AttractionCreatePayload) => {
            const res = await createAttraction(payload);
            if (!res.success) throw new Error(res.message || "Tạo điểm tham quan thất bại");
            await reload();
        },
        [reload]
    );

    const update = useCallback(
        async (id: string, payload: AttractionUpdatePayload) => {
            const res = await updateAttraction(id, payload);
            if (!res.success) throw new Error(res.message || "Cập nhật thất bại");
            await reload();
        },
        [reload]
    );

    const remove = useCallback(async (id: string) => {
        const res = await deleteAttraction(id);
        if (!res.success) throw new Error(res.message || "Xóa thất bại");
        setRawItems((prev) => prev.filter((x) => x.id !== id));
        setTotal((t) => Math.max(0, t - 1));
    }, [])

    return {
        items, total, totalPages, loading, error, destinations,
        reload, create, update, remove,
    };
}