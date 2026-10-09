import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useRoomImages } from "../hooks/useRoomImages";
import { getErrorMessage } from "../utils/error";
import { RoomImage } from "../api/hotel";

type Props = {
  roomId: string;
  roomName: string;
  onClose: () => void;
};

export default function RoomImagesModal({ roomId, roomName, onClose }: Props) {
  const { showToast } = useApp();
  const { images, loading, error, reload, add, remove, setOrder } = useRoomImages(roomId);

  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const nextOrder = images.length ? Math.max(...images.map((i) => i.displayOrder)) + 1 : 1;

  const handleAdd = async () => {
    setFormError("");
    const value = url.trim();
    if (!/^https?:\/\/\S+$/i.test(value)) {
      setFormError("Vui lòng nhập một đường dẫn ảnh hợp lệ (bắt đầu bằng http:// hoặc https://, không có khoảng trắng hay dấu phẩy)");
      return;
    }
    setSaving(true);
    try {
      await add(value, nextOrder);
      showToast("Đã thêm ảnh phòng", "success");
      setUrl("");
    } catch (err) {
      setFormError(getErrorMessage(err, "Thêm ảnh thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (img: RoomImage) => {
    if (!window.confirm("Xóa ảnh này?")) return;
    setBusyId(img.id);
    try {
      await remove(img.id);
      showToast("Đã xóa ảnh", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "Xóa ảnh thất bại"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const commitOrder = async (img: RoomImage, raw: string) => {
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < 0 || value === img.displayOrder) return;
    setBusyId(img.id);
    try {
      await setOrder(img.id, value);
    } catch (err) {
      showToast(getErrorMessage(err, "Đổi thứ tự thất bại"), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="modal-backdrop open"
      style={{ zIndex: 260 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Ảnh phòng</div>
            <div className="td-sub">{roomName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 16 }}>
              Đang tải ảnh...
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 16 }}>
              <div style={{ color: "var(--red)", marginBottom: 8 }}>{error}</div>
              <button className="btn btn-outline btn-sm" onClick={reload}>
                Thử lại
              </button>
            </div>
          ) : images.length === 0 ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 16 }}>
              Phòng này chưa có ảnh
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
                gap: 12,
              }}
            >
              {images.map((img) => (
                <div
                  key={img.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    overflow: "hidden",
                    opacity: busyId === img.id ? 0.5 : 1,
                  }}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                      padding: 8,
                    }}
                  >
                    <label className="td-sub" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      Thứ tự
                      <input
                        // key đổi theo displayOrder để ô nhập được nạp lại sau khi lưu
                        key={img.id + "-" + img.displayOrder}
                        className="form-input"
                        type="number"
                        min={0}
                        defaultValue={img.displayOrder}
                        style={{ width: 56, padding: "4px 6px" }}
                        onBlur={(e) => commitOrder(img, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      />
                    </label>
                    <button
                      className="btn btn-danger btn-sm"
                      title="Xóa ảnh"
                      disabled={busyId === img.id}
                      onClick={() => handleDelete(img)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              Thêm ảnh mới
            </div>
            <div className="form-group">
              <label className="form-label">Đường dẫn ảnh (URL) *</label>
              <input
                className="form-input"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <span className="form-hint">
                Mỗi lần thêm một ảnh, sẽ xếp ở vị trí {nextOrder}. Sửa ô "Thứ tự" ở ảnh để đổi vị trí.
              </span>
            </div>

            {formError && (
              <div
                style={{
                  color: "var(--red)",
                  background: "var(--red-lt)",
                  padding: "8px 12px",
                  borderRadius: 7,
                  fontSize: 13,
                  marginTop: 10,
                }}
              >
                {formError}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
          <button className="btn btn-purple" onClick={handleAdd} disabled={saving}>
            {saving ? "Đang thêm..." : "＋ Thêm ảnh"}
          </button>
        </div>
      </div>
    </div>
  );
}