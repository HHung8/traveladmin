import { useCallback, useEffect, useState } from "react";
import { AttractionSchedule, createAttractionSchedule, deleteAttractionSchedule, getAttractionSchedules } from "../api/attractions";
import { getErrorMessage } from "../utils/error";


export function useAttractionSchedules(attractionId: string) {
    const [schedules, setSchedules] = useState<AttractionSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            setError("");
            try {
                const res = await getAttractionSchedules(attractionId);
                if (!res.success) throw new Error(res.message || "Không tải được lịch tham quan");
                setSchedules(
                    [...(res.data ?? [])].sort(
                        (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
                    )
                );
            } catch (err) {
                setError(getErrorMessage(err, "Không tải được lịch tham quan"));
            } finally {
                setLoading(false);
            }
        },
        [attractionId]
    );

    useEffect(() => {
        load();
    }, [load])

    const add = useCallback(
        async (visitDate: string, availableSlots: number, overridePrice: number | null) => {
            const res = await createAttractionSchedule({ attractionId, visitDate, availableSlots, overridePrice });
            if (!res.success) throw new Error(res.message || "Tạo lịch thất bại");
            await load(true);
        },
        [attractionId, load]
    );

    const remove = useCallback(
        async (id: string) => {
            const res = await deleteAttractionSchedule(id);
            if (!res.success) throw new Error(res.message || "Xóa lịch thất bại");
            await load(true);
        },
        [load]
    );

    return { schedules, loading, error, reload: () => load(), add, remove };
}