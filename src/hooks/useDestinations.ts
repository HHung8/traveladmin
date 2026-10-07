import { useCallback, useState, useEffect } from "react";
import { createDestination, deleteDestination, DestinationDetail, DestinationPayload, getDestination, getDestinations, updateDestination, type Destination, } from "../api/destinations";
import { getErrorMessage } from "../utils/error";

export function useDestinations() {
    const [items, setItems] = useState<Destination[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getDestinations();
            if (!res.success) throw new Error(res.message || "Không tải được dữ liệu");
            const list = res.data?.items ?? [];
            setItems(list);
            setTotal(res.data?.totalCount ?? list.length);
        } catch (error) {
            setError(getErrorMessage(error, "Không tải được danh sách điểm đến"))
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);


  // Lấy chi tiết (có thêm climate, bestTimeToVisit)
  const getDetail = useCallback(async (id: string): Promise<DestinationDetail> => {
    const res = await getDestination(id);
    if (!res.success) throw new Error(res.message || "Không lấy được chi tiết");
    return res.data;
  }, []);

  // Thêm mới (id = null) hoặc cập nhật (có id), xong tự tải lại danh sách
  const save = useCallback(
    async (id: string | null, payload: DestinationPayload) => {
      const res = id
        ? await updateDestination(id, payload)
        : await createDestination(payload);
      if (!res.success) throw new Error(res.message || "Lưu thất bại");
      await reload();
    },
    [reload]
  );

  const remove = useCallback(async(id:string) => {
    const res = await deleteDestination(id);
    if (!res.success) throw new Error(res.message || "Xóa thất bại");
    setItems((prev) => prev.filter((x) => x.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, [])

  return {items, total, loading, error, reload, getDetail, save, remove }

}