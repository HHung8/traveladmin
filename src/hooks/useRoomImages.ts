
import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../utils/error";
import { addRoomImage, deleteRoomImage, getRoomImages, RoomImage, updateRoomImageOrder } from "../api/hotel";

/** Logic gọi API ảnh của một phòng (thêm bằng URL, xóa, đổi thứ tự). */
export function useRoomImages(roomId: string) {
  const [images, setImages] = useState<RoomImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await getRoomImages(roomId);
        if (!res.success) throw new Error(res.message || "Không tải được ảnh phòng");
        setImages([...(res.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder));
      } catch (err) {
        setError(getErrorMessage(err, "Không tải được ảnh phòng"));
      } finally {
        setLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (imageUrl: string, displayOrder: number) => {
      const res = await addRoomImage(roomId, { imageUrl, displayOrder });
      if (!res.success) throw new Error(res.message || "Thêm ảnh thất bại");
      await load(true);
    },
    [roomId, load]
  );

  const remove = useCallback(
    async (imageId: string) => {
      const res = await deleteRoomImage(roomId, imageId);
      if (!res.success) throw new Error(res.message || "Xóa ảnh thất bại");
      await load(true);
    },
    [roomId, load]
  );

  const setOrder = useCallback(
    async (imageId: string, displayOrder: number) => {
      const res = await updateRoomImageOrder(roomId, imageId, displayOrder);
      if (!res.success) throw new Error(res.message || "Đổi thứ tự thất bại");
      await load(true);
    },
    [roomId, load]
  );

  return { images, loading, error, reload: () => load(), add, remove, setOrder };
}