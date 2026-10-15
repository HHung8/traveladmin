import { useCallback, useEffect, useState } from "react";
import { deleteReview, getReview, ReviewDetail } from "../api/reviews";
import { getErrorMessage } from "../utils/error";


export function useReviewDetail(reviewId: string) {
    const [detail, setDetail] = useState<ReviewDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(
        async (slient = false) => {
            if(!slient) setLoading(true);
            setError("");
            try {
                const res = await getReview(reviewId);
                if(!res.success) throw new Error(res.message || "Không tải được chi tiết");
                setDetail(res.data);
            } catch (error) {
                setError(getErrorMessage(error, "Không tải được chi tiết đánh giá"));
            } finally {
                setLoading(false);
            }
        },
        [reviewId]
    );

    useEffect(() => {
        load()
    }, [load]);

    const removeImage = useCallback(
        async (imageId:string) => {
            const res = await deleteReview(imageId);
            if(!res.success) throw new Error(res.message || "Xoá ảnh thất bại");
            await load(true);
        }, [load]
    )

    return {detail, loading, error, removeImage};

}