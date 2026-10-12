import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAttractionSchedules } from "../hooks/useAttractionSchedules";
import { getErrorMessage } from "../utils/error";
import { AttractionSchedule } from "../api/attractions";

type Props = {
  attractionId: string;
  attractionName: string;
  onClose: () => void;
};

const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

const EMPTY = { visitDate: "", availableSlots: "", overridePrice: "" };

export default function AttractionSchedulesModal({ attractionId, attractionName, onClose }: Props) {
  const { showToast } = useApp();
  const { schedules, loading, error, reload, add, remove } = useAttractionSchedules(attractionId);

  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setField = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAdd = async () => {
    setFormError("");

    if (!form.visitDate) {
      setFormError("Vui lòng chọn ngày giờ tham quan");
      return;
    }
    const slots = Number(form.availableSlots);
    if (form.availableSlots === "" || !Number.isInteger(slots) || slots < 1) {
      setFormError("Số chỗ phải là số nguyên từ 1 trở lên");
      return;
    }
    let overridePrice: number | null = null;
    if (form.overridePrice !== "") {
      overridePrice = Number(form.overridePrice);
      if (Number.isNaN(overridePrice) || overridePrice < 0) {
        setFormError("Giá riêng phải là số không âm");
        return;
      }
    }

    setSaving(true);
    try {
      await add(new Date(form.visitDate).toISOString(), slots, overridePrice);
      showToast("Đã thêm lịch tham quan", "success");
      setForm(EMPTY);
    } catch (err) {
      setFormError(getErrorMessage(err, "Tạo lịch thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: AttractionSchedule) => {
    if (!window.confirm(`Xóa lịch ngày ${fmtDate(s.visitDate)}?`)) return;
    setDeletingId(s.id);
    try {
      await remove(s.id);
      showToast("Đã xóa lịch tham quan", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "Xóa lịch thất bại"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="modal-backdrop open"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Lịch tham quan</div>
            <div className="td-sub">{attractionName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 16 }}>
              Đang tải lịch tham quan...
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 16 }}>
              <div style={{ color: "var(--red)", marginBottom: 8 }}>{error}</div>
              <button className="btn btn-outline btn-sm" onClick={reload}>
                Thử lại
              </button>
            </div>
          ) : schedules.length === 0 ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 16 }}>
              Địa điểm này chưa có lịch tham quan
            </div>
          ) : (
            <div className="schedule-grid">
              {schedules.map((s) => (
                <div className="schedule-card" key={s.id}>
                  <div className="sch-meta">
                    <div className="sch-row">
                      <span className="sch-icon">📅</span>
                      {fmtDate(s.visitDate)}
                    </div>
                  </div>
                  <div className="sch-foot">
                    <div>
                      <div className="sch-price">
                        {s.overridePrice != null ? fmtMoney(s.overridePrice) : "Giá gốc"}
                      </div>
                      <div className="sch-slots">Còn {s.availableSlots} chỗ</div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      title="Xóa lịch"
                      disabled={deletingId === s.id}
                      onClick={() => handleDelete(s)}
                    >
                      {deletingId === s.id ? "..." : "🗑"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              Thêm lịch mới
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Ngày giờ tham quan *</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={form.visitDate}
                  onChange={(e) => setField("visitDate", e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Số chỗ *</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={form.availableSlots}
                    onChange={(e) => setField("availableSlots", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá riêng (tùy chọn)</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Để trống = dùng phí vào cửa"
                    value={form.overridePrice}
                    onChange={(e) => setField("overridePrice", e.target.value)}
                  />
                </div>
              </div>

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
          <button className="btn btn-purple" onClick={handleAdd} disabled={saving}>
            {saving ? "Đang lưu..." : "＋ Thêm lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}