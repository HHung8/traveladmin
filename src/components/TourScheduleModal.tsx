import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useTourSchedules } from "../hooks/useTourSchedules";
import { getErrorMessage } from "../utils/error";

type Props = {
  tourId: string;
  tourTitle: string;
  onClose: () => void;
};

const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US");
const fmtDate = (iso: string) => new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
const EMPTY = { startDate: "", endDate: "", availableSlots: "", overridePrice: "" };

export default function TourSchedulesModal({ tourId, tourTitle, onClose }: Props) {
  const { showToast } = useApp();
  const { schedules, loading, error, reload, add } = useTourSchedules(tourId);

  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAdd = async () => {
    setFormError("");

    if (!form.startDate || !form.endDate) {
      setFormError("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
      return;
    }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) {
      setFormError("Ngày kết thúc phải sau ngày bắt đầu");
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
      await add({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        availableSlots: slots,
        overridePrice,
      });
      showToast("Đã thêm lịch khởi hành", "success");
      setForm(EMPTY);
    } catch (err) {
      setFormError(getErrorMessage(err, "Tạo lịch thất bại"));
    } finally {
      setSaving(false);
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
            <div className="modal-title">Lịch khởi hành</div>
            <div className="td-sub">{tourTitle}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Danh sách lịch */}
          {loading ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 16 }}>
              Đang tải lịch khởi hành...
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
              Tour này chưa có lịch khởi hành
            </div>
          ) : (
            <div className="schedule-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
              {schedules.map((s) => (
                <div className="schedule-card" key={s.id}>
                  <div className="sch-meta">
                    <div className="sch-row">
                      <span className="sch-icon">🛫</span>
                      {fmtDate(s.startDate)}
                    </div>
                    <div className="sch-row">
                      <span className="sch-icon">🛬</span>
                      {fmtDate(s.endDate)}
                    </div>
                  </div>
                  <div className="sch-foot">
                    <div className="sch-price">
                      {s.overridePrice != null ? fmtMoney(s.overridePrice) : "Giá gốc"}
                    </div>
                    <div className="sch-slots">Còn {s.availableSlots} chỗ</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form thêm lịch */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              Thêm lịch mới
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bắt đầu *</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kết thúc *</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                  />
                </div>
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
                    placeholder="Để trống = dùng giá tour"
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