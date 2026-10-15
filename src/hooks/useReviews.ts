import { useCallback, useEffect, useState } from "react";
import { getAttractions } from "../api/attractions";
import { getHotels } from "../api/hotel";
import { deleteReview, getMyReviews, getReviewsByTarget, MyReview, Review, ReviewTargetType } from "../api/reviews";
import { getTours } from "../api/tour";
import { getErrorMessage } from "../utils/error";


export const REVIEWS_PAGE_SIZE = 10;
 
export interface TargetOption {
    id: string;
    title: string;
    averageRating?: number | null;
    reviewCount?: number;
}

async function fetchTargets(type: ReviewTargetType): Promise<TargetOption[]> {
    const params = { page: 1, pageSize: 100 };
    if (type === "tour") {
        const res = await getTours(params);
        if (!res.success) throw new Error(res.message || "Không tải được danh sách tour");
        return (res.data.items ?? []).map((t) => ({
            id: t.id,
            title: t.title,
            averageRating: t.averageRating,
            reviewCount: t.reviewCount,
        }));
    }

    if (type === "hotel") {
        const res = await getHotels(params);
        if (!res.success) throw new Error(res.message || "Không tải được danh sách khách sạn");
        return (res.data.items ?? []).map((h) => ({
            id: h.id,
            title: h.name,
            averageRating: h.averageRating,
            reviewCount: h.reviewCount,
        }));
    }
    const res = await getAttractions(params);
    if (!res.success) throw new Error(res.message || "Không tải được danh sách điểm tham quan");
    return (res.data.items ?? []).map((a) => ({ id: a.id, title: a.name }));
}

export function useReviewsTargets(type: ReviewTargetType) {
    const [loaded, setLoaded] = useState<{ type: ReviewTargetType; items: TargetOption[]; error: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const items = await fetchTargets(type);
                if (!cancelled) setLoaded({ type, items, error: "" });
            } catch (err) {
                if (!cancelled) setLoaded({ type, items: [], error: getErrorMessage(err, "Không tải được danh sách") });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [type]);

    const ready = loaded?.type === type;
    return {
        targets: ready ? loaded!.items : [],
        loading: !ready,
        error: ready ? loaded!.error : "",
    };
}

export function useTargetReviews(type: ReviewTargetType, targetId: string, page: number) {
    const [items, setItems] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        if (!targetId) {
            setItems([]);
            setTotal(0);
            setTotalPages(1);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await getReviewsByTarget(type, targetId, {page, pageSize: REVIEWS_PAGE_SIZE});
            if(!res.success) throw new Error(res.message || "Không tải được đánh giá");
            setItems(res.data.items ?? []);
            setTotal(res.data.totalCount ?? 0);
            setTotalPages(Math.max(1, res.data.totalPages ?? 1));
        } catch (error) {
            setItems([]);
            setError(getErrorMessage(error, "Không tai được đánh giá"));
        } finally {
            setLoading(false);
        }
    }, [type, targetId, page]);

    useEffect(() => {
        reload();
    }, [reload]);


    const remove = useCallback(async(id:string) => {
        const res = await deleteReview(id);
        if(!res.success) throw new Error (res.message || "Xoá đánh giá thất bại");
    }, []);

    return {items, total, totalPages, loading, error, reload, remove}
}

export function useMyReviews(page:number) {
    const [items, setItems] = useState<MyReview[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPage, setTotalPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reload = useCallback( async() => {
        setLoading(false);
        setError("");
        try {
            const res = await getMyReviews({page, pageSize: REVIEWS_PAGE_SIZE});
            if(!res.success) throw new Error(res.message || "Không tải được đánh giá");
            setItems(res.data.items ?? []);
            setTotal(res.data.totalCount ?? 0);
            setTotalPage(Math.max(1, res.data.totalPages ?? 1));
        } catch (error) {
            setError(getErrorMessage(error, "Không tải được đánh giá"));
        } finally {
            setLoading(false);
        }
    },[page]);

    useEffect(() => {
        reload();
    }, [reload]);

    const remove = useCallback(async(id:string) => {
        const res = await deleteReview(id);
        if(!res.success) throw new Error(res.message || "Xoá đánh giá thất bại");
    },[]);

    return {items, total, totalPage, loading, error, reload, remove}
}