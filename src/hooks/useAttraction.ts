import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Attraction, AttractionBrief, AttractionCreatePayload, AttractionUpdatePayload, createAttraction, deleteAttraction, getAttractions, updateAttraction } from "../api/attractions";
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
    searchTerm: string;
}


export function useAttractions({ page, destinationId, searchTerm }: Options) {
    const [rawItems, setRawItems] = useState<AttractionBrief[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [destinations, setDestinations] = useState<DestinationOption[]>([]);
    const [destinationsError, setDestinationsError] = useState("");
    const [destinationsLoading, setDestinationsLoading] = useState(false);
    const requestId = useRef(0);

    const reload = useCallback(async () => {
        const currentRequestId = ++requestId.current;
        setLoading(true);
        setError("");
        try {
            const res = await getAttractions({
                keyword: searchTerm.trim() || undefined,
                destinationId: destinationId || undefined,
                page,
                pageSize: ATTRACTIONS_PAGE_SIZE,
            });
            if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
            if (currentRequestId !== requestId.current) return;

            const list = res.data.items ?? [];
            const count = res.data.totalCount ?? list.length;
            setRawItems(list);
            setTotal(count);
            setTotalPages(
                Math.max(
                    1,
                    res.data.totalPages ?? Math.ceil(count / (res.data.pageSize || ATTRACTIONS_PAGE_SIZE))
                )
            );
        } catch (err) {
            if (currentRequestId === requestId.current) {
                setError(getErrorMessage(err, "Không tải được danh sách điểm tham quan"));
            }
        } finally {
            if (currentRequestId === requestId.current) setLoading(false);
        }
    }, [page, destinationId, searchTerm]);

    useEffect(() => {
        let cancelled = false;
        void Promise.resolve().then(() => {
            if (!cancelled) void reload();
        });
        return () => {
            cancelled = true;
        };
    }, [reload]);

    const reloadDestinations = useCallback(async () => {
        setDestinationsLoading(true);
        setDestinationsError("");
        try {
            const res = await getDestinations({ page: 1, pageSize: 100 });
            if (!res.success) throw new Error(res.message || "Không tải được danh sách điểm đến");
            setDestinations((res.data?.items ?? []).map((d) => ({ id: d.id, name: d.name })));
        } catch (err) {
            setDestinationsError(getErrorMessage(err, "Không tải được danh sách điểm đến"));
        } finally {
            setDestinationsLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        void Promise.resolve().then(() => {
            if (!cancelled) void reloadDestinations();
        });
        return () => {
            cancelled = true;
        };
    }, [reloadDestinations]);

    const items: Attraction[] = useMemo(() => {
        const name = destinations.find((d) => d.id === destinationId)?.name ?? "";
        return rawItems.map((a) => ({
            ...a,
            destinationId: a.destinationId ?? destinationId,
            destinationName:
                a.destinationName ||
                (destinations.find((destination) => destination.id === a.destinationId)?.name ?? name),
        }));
    }, [rawItems, destinations, destinationId]);


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
        items, total, totalPages, loading, error, destinations, destinationsError, destinationsLoading,
        reload, reloadDestinations, create, update, remove,
    };
}