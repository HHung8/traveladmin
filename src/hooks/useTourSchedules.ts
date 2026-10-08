import { useCallback, useEffect, useState } from "react";
import { createTourSchedule, getTourSchedules, SchedulePayload, TourSchedule } from "../api/tour";
import { getErrorMessage } from "../utils/error";


/** Logic gọi API lịch khởi hành của một tour. tourId = null thì không làm gì. */
export function useTourSchedules(tourId: string | null) {
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!tourId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getTourSchedules(tourId);
      if (!res.success) throw new Error(res.message || "Không tải được lịch khởi hành");
      const list = [...(res.data ?? [])].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      setSchedules(list);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được lịch khởi hành"));
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    setSchedules([]);
    reload();
  }, [reload]);

  const add = useCallback(
    async (payload: SchedulePayload) => {
      if (!tourId) return;
      const res = await createTourSchedule(tourId, payload);
      if (!res.success) throw new Error(res.message || "Tạo lịch thất bại");
      await reload();
    },
    [tourId, reload]
  );

  return { schedules, loading, error, reload, add };
}