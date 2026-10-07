import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useDestinations } from '../hooks/useDestinations';
import { getErrorMessage } from '../utils/error';
import { Destination, DestinationPayload } from '../api/destinations';


const EMPTY_FORM = {
  name: "",
  country: "",
  city: "",
  description: "",
  latitude: "",
  longitude: "",
  climate: "",
  bestTimeToVisit: "",
  isFeatured: false,
};

type FormState = typeof EMPTY_FORM;

export default function Destinations() {
  const {showToast} = useApp();
  const {items, total, loading, error, reload, getDetail, save, remove } = useDestinations();

   // Bộ lọc
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
 
  // Modal thêm / sửa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
 
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(items.map((d) => d.country).filter(Boolean))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return items.filter((d) => {
      const matchCountry = !country || d.country === country;
      const matchKeyword =
        !keyword ||
        d.name.toLowerCase().includes(keyword) ||
        d.city.toLowerCase().includes(keyword) ||
        d.country.toLowerCase().includes(keyword);
      return matchCountry && matchKeyword;
    });
  }, [items, q, country]);

   const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
 
  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setFormError("");
  };
 
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };
 
  const openEdit = async (id: string) => {
    setEditingId(id);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
    setLoadingDetail(true);
    try {
      // Danh sách không có climate / bestTimeToVisit nên lấy chi tiết
      const d = await getDetail(id);
      setForm({
        name: d.name ?? "",
        country: d.country ?? "",
        city: d.city ?? "",
        description: d.description ?? "",
        latitude: String(d.latitude ?? ""),
        longitude: String(d.longitude ?? ""),
        climate: d.climate ?? "",
        bestTimeToVisit: d.bestTimeToVisit ?? "",
        isFeatured: !!d.isFeatured,
      });
    } catch (err) {
      showToast(getErrorMessage(err, "Không lấy được chi tiết điểm đến"), "error");
      setModalOpen(false);
      setEditingId(null);
    } finally {
      setLoadingDetail(false);
    }
  };
 
  const handleSubmit = async () => {
    setFormError("");
 
    if (!form.name.trim() || !form.country.trim() || !form.city.trim()) {
      setFormError("Vui lòng nhập tên, quốc gia và thành phố");
      return;
    }
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (form.latitude === "" || form.longitude === "" || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setFormError("Vĩ độ và kinh độ phải là số");
      return;
    }
 
    const payload: DestinationPayload = {
      name: form.name.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      description: form.description.trim(),
      latitude,
      longitude,
      climate: form.climate.trim(),
      bestTimeToVisit: form.bestTimeToVisit.trim(),
      isFeatured: form.isFeatured,
    };
 
    setSaving(true);
    try {
      await save(editingId, payload);
 
      showToast(editingId ? "Đã cập nhật điểm đến" : "Đã thêm điểm đến", "success");
      setModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setFormError(getErrorMessage(err, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  };
 
  // ===== Xóa =====
  const handleDelete = async (d: Destination) => {
    if (!window.confirm(`Xóa điểm đến "${d.name}"?`)) return;
    setDeletingId(d.id);
    try {
      await remove(d.id);
      showToast("Đã xóa điểm đến", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "Xóa thất bại"), "error");
    } finally {
      setDeletingId(null);
    }
  };
 
  // ===== Giao diện =====
  const renderBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            Đang tải dữ liệu...
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td colSpan={7} style={{ textAlign: "center", padding: 32 }}>
            <div style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>
            <button className="btn btn-outline btn-sm" onClick={reload}>
              Thử lại
            </button>
          </td>
        </tr>
      );
    }
    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={7} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            {items.length === 0 ? "Chưa có điểm đến nào" : "Không tìm thấy kết quả phù hợp"}
          </td>
        </tr>
      );
    }
    return filtered.map((d) => (
      <tr key={d.id}>
        <td>
          {d.thumbnailUrl ? (
            <img className="td-img" src={d.thumbnailUrl} alt={d.name} />
          ) : (
            <div className="td-img">📍</div>
          )}
        </td>
        <td>
          <div className="td-name">
            {d.name} {d.isFeatured && <span title="Nổi bật">⭐</span>}
          </div>
        </td>
        <td>{d.country}</td>
        <td>{d.city}</td>
        <td>{d.tourCount}</td>
        <td>{d.hotelCount}</td>
        <td>
          <div className="td-actions">
            <button className="btn btn-outline btn-sm" title="Sửa" onClick={() => openEdit(d.id)}>
              ✏️
            </button>
            <button
              className="btn btn-danger btn-sm"
              title="Xóa"
              disabled={deletingId === d.id}
              onClick={() => handleDelete(d)}
            >
              {deletingId === d.id ? "..." : "🗑"}
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Quản lý Điểm đến</div>
          <div className="section-sub">Tổng {total} điểm đến</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ Thêm điểm đến
        </button>
      </div>
 
      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm điểm đến..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="filter-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Tất cả quốc gia</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
 
        <table>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Quốc gia</th>
              <th>Thành phố</th>
              <th>Tours</th>
              <th>Khách sạn</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
 
      {/* Modal thêm / sửa */}
      {modalOpen && (
        <div className="modal-backdrop open" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                {editingId ? "Sửa điểm đến" : "Thêm điểm đến"}
              </div>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
 
            <div className="modal-body">
              {loadingDetail ? (
                <div className="td-sub" style={{ textAlign: "center", padding: 24 }}>
                  Đang tải chi tiết...
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Tên điểm đến *</label>
                    <input
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                    />
                  </div>
 
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Quốc gia *</label>
                      <input
                        className="form-input"
                        value={form.country}
                        onChange={(e) => setField("country", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Thành phố *</label>
                      <input
                        className="form-input"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                      />
                    </div>
                  </div>
 
                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <textarea
                      className="form-textarea"
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                    />
                  </div>
 
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Vĩ độ (latitude) *</label>
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) => setField("latitude", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kinh độ (longitude) *</label>
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) => setField("longitude", e.target.value)}
                      />
                    </div>
                  </div>
 
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Khí hậu</label>
                      <input
                        className="form-input"
                        value={form.climate}
                        onChange={(e) => setField("climate", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Thời điểm đẹp nhất</label>
                      <input
                        className="form-input"
                        value={form.bestTimeToVisit}
                        onChange={(e) => setField("bestTimeToVisit", e.target.value)}
                      />
                    </div>
                  </div>
 
                  <label className="form-toggle">
                    <input
                      className="toggle-input"
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setField("isFeatured", e.target.checked)}
                    />
                    <span className="toggle-label">Điểm đến nổi bật</span>
                  </label>
 
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
                </>
              )}
            </div>
 
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>
                Hủy
              </button>
              <button
                className="btn btn-purple"
                onClick={handleSubmit}
                disabled={saving || loadingDetail}
              >
                {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}