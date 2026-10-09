import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHotelRooms } from "../hooks/useHotelRooms";
import { getErrorMessage } from "../utils/error";
import { Room } from "../api/hotel";
import RoomImagesModal from "./RoomImagesModal";

type Props = {
  hotelId: string;
  hotelName: string;
  onClose: () => void;
  onChanged?: () => void; // gọi sau khi thêm / sửa / xóa phòng để trang cha cập nhật giá thấp nhất
};

const EMPTY = {
  roomType: "",
  description: "",
  pricePerNight: "",
  capacity: "",
  totalRooms: "",
  amenities: "",
  isAvailable: true,
};
type RoomForm = typeof EMPTY;

const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US");

export default function HotelRoomsModal({ hotelId, hotelName, onClose, onChanged }: Props) {
  const { showToast } = useApp();
  const { rooms, loading, error, reload, add, edit, remove } = useHotelRooms(hotelId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoomForm>(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imagesRoom, setImagesRoom] = useState<Room | null>(null);

  const setField = <K extends keyof RoomForm>(key: K, value: RoomForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormError("");
  };

  const startEdit = (r: Room) => {
    setEditingId(r.id);
    setFormError("");
    setForm({
      roomType: r.roomType ?? "",
      description: r.description ?? "",
      pricePerNight: String(r.pricePerNight ?? ""),
      capacity: String(r.capacity ?? ""),
      totalRooms: r.totalRooms != null ? String(r.totalRooms) : "", // API chi tiết có thể không trả về
      amenities: r.amenities ?? "",
      isAvailable: r.isAvailable ?? true,
    });
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!form.roomType.trim()) {
      setFormError("Vui lòng nhập loại phòng");
      return;
    }
    const pricePerNight = Number(form.pricePerNight);
    if (form.pricePerNight === "" || Number.isNaN(pricePerNight) || pricePerNight < 0) {
      setFormError("Giá mỗi đêm phải là số không âm");
      return;
    }
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      setFormError("Sức chứa phải là số nguyên từ 1 trở lên");
      return;
    }
    const totalRooms = Number(form.totalRooms);
    if (!Number.isInteger(totalRooms) || totalRooms < 1) {
      setFormError("Tổng số phòng phải là số nguyên từ 1 trở lên");
      return;
    }

    const base = {
      roomType: form.roomType.trim(),
      description: form.description.trim(),
      pricePerNight,
      capacity,
      totalRooms,
      amenities: form.amenities.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await edit(editingId, { ...base, isAvailable: form.isAvailable });
        showToast("Đã cập nhật phòng", "success");
      } else {
        await add(base);
        showToast("Đã thêm phòng", "success");
      }
      resetForm();
      onChanged?.();
    } catch (err) {
      setFormError(getErrorMessage(err, "Lưu phòng thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Room) => {
    if (!window.confirm(`Xóa phòng "${r.roomType}"?`)) return;
    setDeletingId(r.id);
    try {
      await remove(r.id);
      if (editingId === r.id) resetForm();
      showToast("Đã xóa phòng", "success");
      onChanged?.();
    } catch (err) {
      showToast(getErrorMessage(err, "Xóa phòng thất bại"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="modal-backdrop open"
      style={{ zIndex: 220 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Quản lý phòng</div>
            <div className="td-sub">{hotelName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Danh sách phòng */}
          {loading ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 16 }}>
              Đang tải danh sách phòng...
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 16 }}>
              <div style={{ color: "var(--red)", marginBottom: 8 }}>{error}</div>
              <button className="btn btn-outline btn-sm" onClick={reload}>
                Thử lại
              </button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 16 }}>
              Khách sạn này chưa có phòng nào
            </div>
          ) : (
            <div className="table-wrap" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Loại phòng</th>
                    <th>Giá / đêm</th>
                    <th>Sức chứa</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id} style={editingId === r.id ? { background: "var(--purple-lt)" } : undefined}>
                      <td>
                        <div className="td-name">{r.roomType}</div>
                        {r.description && (
                          <div
                            className="td-sub"
                            style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {r.description}
                          </div>
                        )}
                      </td>
                      <td>{fmtMoney(r.pricePerNight)}</td>
                      <td>{r.capacity} người</td>
                      <td>
                        <span className={"badge " + (r.isAvailable ? "badge-green" : "badge-gray")}>
                          {r.isAvailable ? "Còn phòng" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-outline btn-sm" title="Ảnh phòng" onClick={() => setImagesRoom(r)}>
                            🖼
                          </button>
                          <button className="btn btn-outline btn-sm" title="Sửa" onClick={() => startEdit(r)}>
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Xóa"
                            disabled={deletingId === r.id}
                            onClick={() => handleDelete(r)}
                          >
                            {deletingId === r.id ? "..." : "🗑"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form thêm / sửa phòng */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              {editingId ? "Sửa phòng" : "Thêm phòng mới"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Loại phòng *</label>
                  <input
                    className="form-input"
                    placeholder="Deluxe, Standard..."
                    value={form.roomType}
                    onChange={(e) => setField("roomType", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá mỗi đêm ($) *</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    step="any"
                    value={form.pricePerNight}
                    onChange={(e) => setField("pricePerNight", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sức chứa (người) *</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setField("capacity", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tổng số phòng *</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={form.totalRooms}
                    onChange={(e) => setField("totalRooms", e.target.value)}
                  />
                  {editingId && !form.totalRooms && (
                    <span className="form-hint">API không trả về giá trị hiện tại, vui lòng nhập lại</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 56 }}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tiện nghi</label>
                <input
                  className="form-input"
                  value={form.amenities}
                  onChange={(e) => setField("amenities", e.target.value)}
                />
              </div>

              {editingId && (
                <label className="form-toggle">
                  <input
                    className="toggle-input"
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setField("isAvailable", e.target.checked)}
                  />
                  <span className="toggle-label">Còn phòng để đặt</span>
                </label>
              )}

              {formError && (
                <div
                  style={{
                    color: "var(--red)",
                    background: "var(--red-lt)",
                    padding: "8px 12px",
                    borderRadius: 7,
                    fontSize: 13,
                  }}
                >
                  {formError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
          {editingId && (
            <button className="btn btn-outline" onClick={resetForm} disabled={saving}>
              Hủy sửa
            </button>
          )}
          <button className="btn btn-purple" onClick={handleSubmit} disabled={saving}>
            {saving ? "Đang lưu..." : editingId ? "Cập nhật phòng" : "＋ Thêm phòng"}
          </button>
        </div>
      </div>

      {imagesRoom && (
        <RoomImagesModal
          roomId={imagesRoom.id}
          roomName={imagesRoom.roomType}
          onClose={() => setImagesRoom(null)}
        />
      )}
    </div>
  );
}