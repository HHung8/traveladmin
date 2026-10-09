import { useCallback, useEffect, useState } from "react";

import { getErrorMessage } from "../utils/error";
import { createRoom, deleteRoom, getHotel, Room, RoomCreatePayload, RoomUpdatePayload, updateRoom } from "../api/hotel";

/** Logic gọi API phòng của một khách sạn. Danh sách phòng lấy từ GET /api/hotels/{id}. */
export function useHotelRooms(hotelId: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // silent = true: tải lại ngầm, không nháy trạng thái "đang tải"
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await getHotel(hotelId);
        if (!res.success) throw new Error(res.message || "Không tải được danh sách phòng");
        setRooms(res.data.rooms ?? []);
      } catch (err) {
        setError(getErrorMessage(err, "Không tải được danh sách phòng"));
      } finally {
        setLoading(false);
      }
    },
    [hotelId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (payload: RoomCreatePayload) => {
      const res = await createRoom(hotelId, payload);
      if (!res.success) throw new Error(res.message || "Tạo phòng thất bại");
      await load(true);
    },
    [hotelId, load]
  );

  const edit = useCallback(
    async (roomId: string, payload: RoomUpdatePayload) => {
      const res = await updateRoom(hotelId, roomId, payload);
      if (!res.success) throw new Error(res.message || "Cập nhật phòng thất bại");
      await load(true);
    },
    [hotelId, load]
  );

  const remove = useCallback(
    async (roomId: string) => {
      const res = await deleteRoom(hotelId, roomId);
      if (!res.success) throw new Error(res.message || "Xóa phòng thất bại");
      await load(true);
    },
    [hotelId, load]
  );

  return { rooms, loading, error, reload: () => load(), add, edit, remove };
}