import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAttractions } from "../hooks/useAttraction";
import { Attraction } from "../api/attractions";
import { getErrorMessage } from "../utils/error";
import AttractionSchedulesModal from "../components/AttractionSchedulesModal";

const EMPTY_FORM = {
  destinationId: "",
  name: "",
  category: "",
  description: "",
  thumbnailUrl: "",
  latitude: "",
  longitude: "",
  openingHours: "",
  entryFee: "",
  website: "",
};
type FormState = typeof EMPTY_FORM;
const SUGGESTED_CATEGORIES = ["Bãi biển", "Di tích", "Bảo tàng", "Công viên", "Thiên nhiên", "Văn hóa", "Giải trí"];
const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US");
const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

// Danh sách số trang hiển thị (tối đa 5 nút quanh trang hiện tại)
const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

// Ảnh nhỏ trong bảng; URL hỏng (vd "string") thì hiện biểu tượng thay thế
function Thumb({ url, alt }: { url: string | null; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) return <div className="td-img">🎡</div>;
  return <img className="td-img" src={url} alt={alt} onError={() => setBroken(true)} />;
}

// Xem trước ảnh theo URL đang nhập trong form
function UrlPreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  const box = {
    width: 96,
    height: 72,
    borderRadius: 8,
    border: "1px solid var(--border)",
  } as const;
  if (!url || !isHttpUrl(url) || broken) {
    return (
      <div className="td-img" style={box}>
        🖼️
      </div>
    );
  }
  return <img src={url} alt="Xem trước" style={{ ...box, objectFit: "cover" }} onError={() => setBroken(true)} />;
}

export default function Attractions() {
  const { showToast } = useApp();

  // Bộ lọc + phân trang
  const [q, setQ] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [page, setPage] = useState(1);

  // Dữ liệu + gọi API nằm trong hook
  const { items, total, totalPages, loading, error, destinations, reload, create, update, remove } =
    useAttractions({ page, destinationId: destinationFilter });

  // Modal thêm / sửa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDestination, setEditingDestination] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scheduleItem, setScheduleItem] = useState<Attraction | null>(null);

  // Gợi ý danh mục từ dữ liệu đang có + danh sách mặc định
  const categoryOptions = useMemo(() => {
    const set = new Set<string>(SUGGESTED_CATEGORIES);
    items.forEach((a) => a.category && set.add(a.category));
    return Array.from(set);
  }, [items]);

  // Tìm kiếm trên danh sách đang hiển thị
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (a) =>
        a.name.toLowerCase().includes(keyword) ||
        (a.category ?? "").toLowerCase().includes(keyword) ||
        (a.destinationName ?? "").toLowerCase().includes(keyword)
    );
  }, [items, q]);

  // ===== Modal =====
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
    setEditingDestination("");
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  // Danh sách đã có đủ các field cần sửa nên không cần gọi thêm API chi tiết
  const openEdit = (a: Attraction) => {
    setEditingId(a.id);
    setEditingDestination(a.destinationName ?? "");
    setFormError("");
    setForm({
      destinationId: a.destinationId ?? "",
      name: a.name ?? "",
      category: a.category ?? "",
      description: a.description ?? "",
      thumbnailUrl: a.thumbnailUrl ?? "",
      latitude: String(a.latitude ?? ""),
      longitude: String(a.longitude ?? ""),
      openingHours: a.openingHours ?? "",
      entryFee: String(a.entryFee ?? ""),
      website: a.website ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!form.name.trim() || !form.category.trim()) {
      setFormError("Vui lòng nhập tên và danh mục");
      return;
    }
    if (!editingId && !form.destinationId) {
      setFormError("Vui lòng chọn điểm đến");
      return;
    }
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (form.latitude === "" || form.longitude === "" || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setFormError("Vĩ độ và kinh độ phải là số");
      return;
    }
    const entryFee = form.entryFee === "" ? 0 : Number(form.entryFee);
    if (Number.isNaN(entryFee) || entryFee < 0) {
      setFormError("Phí vào cửa phải là số không âm (nhập 0 nếu miễn phí)");
      return;
    }
    const thumbnailUrl = form.thumbnailUrl.trim();
    if (thumbnailUrl && !isHttpUrl(thumbnailUrl)) {
      setFormError("Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    const website = form.website.trim();
    if (website && !isHttpUrl(website)) {
      setFormError("Website phải bắt đầu bằng http:// hoặc https://");
      return;
    }

    const base = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      thumbnailUrl,
      latitude,
      longitude,
      openingHours: form.openingHours.trim(),
      entryFee,
      website,
    };

    setSaving(true);
    try {
      if (editingId) {
        await update(editingId, base);
        showToast("Đã cập nhật điểm tham quan", "success");
      } else {
        await create({ ...base, destinationId: form.destinationId });
        showToast("Đã thêm điểm tham quan", "success");
      }
      setModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setFormError(getErrorMessage(err, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  };

  // ===== Xóa =====
  const handleDelete = async (a: Attraction) => {
    if (!window.confirm(`Xóa điểm tham quan "${a.name}"?`)) return;
    setDeletingId(a.id);
    try {
      await remove(a.id);
      showToast("Đã xóa điểm tham quan", "success");
      // Xóa phần tử cuối của trang > 1 thì lùi về trang trước, ngược lại tải lại để cập nhật phân trang
      if (items.length <= 1 && page > 1) setPage(page - 1);
      else reload();
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
            {items.length === 0 ? "Chưa có điểm tham quan nào" : "Không tìm thấy kết quả phù hợp"}
          </td>
        </tr>
      );
    }
    return filtered.map((a) => (
      <tr key={a.id}>
        <td>
          <Thumb key={a.thumbnailUrl ?? "none"} url={a.thumbnailUrl} alt={a.name} />
        </td>
        <td>
          <div className="td-name">{a.name}</div>
          <div
            className="td-sub"
            style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {a.description}
          </div>
        </td>
        <td>
          <span className="badge badge-blue">{a.category || "—"}</span>
        </td>
        <td>{a.destinationName || "—"}</td>
        <td>{a.openingHours || <span className="td-sub">—</span>}</td>
        <td>{a.entryFee > 0 ? fmtMoney(a.entryFee) : <span className="badge badge-green">Miễn phí</span>}</td>
        <td>
          <div className="td-actions">
            <button className="btn btn-outline btn-sm" title="Lịch tham quan" onClick={() => setScheduleItem(a)}>
              📅
            </button>
            <button className="btn btn-outline btn-sm" title="Sửa" onClick={() => openEdit(a)}>
              ✏️
            </button>
            <button
              className="btn btn-danger btn-sm"
              title="Xóa"
              disabled={deletingId === a.id}
              onClick={() => handleDelete(a)}
            >
              {deletingId === a.id ? "..." : "🗑"}
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
          <div className="section-title">Điểm tham quan</div>
          <div className="section-sub">Tổng {total} điểm tham quan</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ Thêm điểm tham quan
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm theo tên, danh mục..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="filter-select"
            value={destinationFilter}
            onChange={(e) => {
              setDestinationFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả điểm đến</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Địa điểm</th>
              <th>Danh mục</th>
              <th>Điểm đến</th>
              <th>Giờ mở cửa</th>
              <th>Phí vào cửa</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>

        {!destinationFilter && totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Trang {page} / {totalPages} · {total} điểm tham quan
            </div>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ‹
              </button>
              {getPageNumbers(page, totalPages).map((n) => (
                <button
                  key={n}
                  className={"page-btn" + (n === page ? " active" : "")}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal lịch tham quan */}
      {scheduleItem && (
        <AttractionSchedulesModal
          attractionId={scheduleItem.id}
          attractionName={scheduleItem.name}
          onClose={() => setScheduleItem(null)}
        />
      )}

      {/* Modal thêm / sửa */}
      {modalOpen && (
        <div
          className="modal-backdrop open"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title">
                {editingId ? "Sửa điểm tham quan" : "Thêm điểm tham quan"}
              </div>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên địa điểm *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Điểm đến *</label>
                {editingId ? (
                  <>
                    <input className="form-input" value={editingDestination || "—"} disabled />
                    <span className="form-hint">Không thể đổi điểm đến sau khi tạo</span>
                  </>
                ) : (
                  <select
                    className="form-select"
                    value={form.destinationId}
                    onChange={(e) => setField("destinationId", e.target.value)}
                  >
                    <option value="">-- Chọn điểm đến --</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Danh mục *</label>
                  <input
                    className="form-input"
                    list="attraction-categories"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                  />
                  <datalist id="attraction-categories">
                    {categoryOptions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Giờ mở cửa</label>
                  <input
                    className="form-input"
                    placeholder="08:00 - 17:00"
                    value={form.openingHours}
                    onChange={(e) => setField("openingHours", e.target.value)}
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
                  <label className="form-label">Phí vào cửa ($)</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0 = miễn phí"
                    value={form.entryFee}
                    onChange={(e) => setField("entryFee", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    className="form-input"
                    placeholder="https://..."
                    value={form.website}
                    onChange={(e) => setField("website", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Đường dẫn ảnh đại diện</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <UrlPreview key={form.thumbnailUrl.trim()} url={form.thumbnailUrl.trim()} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <input
                      className="form-input"
                      placeholder="https://.../anh.jpg"
                      value={form.thumbnailUrl}
                      onChange={(e) => setField("thumbnailUrl", e.target.value)}
                    />
                    <span className="form-hint">
                      Dùng link trực tiếp tới file ảnh (kết thúc .jpg, .png...), không phải link trang xem ảnh.
                    </span>
                  </div>
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

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>
                Hủy
              </button>
              <button className="btn btn-purple" onClick={handleSubmit} disabled={saving}>
                {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}