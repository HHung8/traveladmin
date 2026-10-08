import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useTours } from "../hooks/useTours";
import { getErrorMessage } from "../utils/error";
import { Tour, TourCreatePayload } from "../api/tour";
import TourSchedulesModal from "../components/TourScheduleModal";

const EMPTY_FORM = {
  destinationId: "",
  title: "",
  description: "",
  highlights: "",
  includes: "",
  excludes: "",
  price: "",
  discountPrice: "",
  durationDays: "",
  maxCapacity: "",
  difficulty: "",
  isActive: true,
};
type FormState = typeof EMPTY_FORM;

const MAX_IMAGE_MB = 5;
const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US");

// Danh sách số trang hiển thị (tối đa 5 nút quanh trang hiện tại)
const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

export default function Tours() {
  const { showToast } = useApp();

  // Bộ lọc + phân trang
  const [q, setQ] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [page, setPage] = useState(1);

  // Dữ liệu + gọi API nằm trong hook
  const {
    items, total, totalPages, loading, error, destinations,
    reload, getDetail, create, update, remove,
  } = useTours({ page, destinationId: destinationFilter });

  // Modal thêm / sửa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDestination, setEditingDestination] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Ảnh đại diện
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [currentThumb, setCurrentThumb] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scheduleTour, setScheduleTour] = useState<Tour | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Tìm kiếm trên danh sách đang hiển thị
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (t) =>
        t.title.toLowerCase().includes(keyword) ||
        (t.destinationName ?? "").toLowerCase().includes(keyword) ||
        (t.difficulty ?? "").toLowerCase().includes(keyword)
    );
  }, [items, q]);

  // ===== Modal =====
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetImage = () => {
    setFile(null);
    setCurrentThumb(null);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setFormError("");
    resetImage();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setFormError("Vui lòng chọn file ảnh (JPG, PNG, WEBP...)");
      return;
    }
    if (picked.size > MAX_IMAGE_MB * 1024 * 1024) {
      setFormError(`Ảnh tối đa ${MAX_IMAGE_MB}MB`);
      return;
    }
    setFormError("");
    setFile(picked);
  };

  const openCreate = () => {
    setEditingId(null);
    setEditingDestination("");
    setForm(EMPTY_FORM);
    setFormError("");
    resetImage();
    setModalOpen(true);
  };

  const openEdit = async (id: string) => {
    setEditingId(id);
    setForm(EMPTY_FORM);
    setFormError("");
    resetImage();
    setModalOpen(true);
    setLoadingDetail(true);
    try {
      // Danh sách không có highlights / includes / excludes nên lấy chi tiết
      const d = await getDetail(id);
      setForm({
        destinationId: d.destinationId ?? "",
        title: d.title ?? "",
        description: d.description ?? "",
        highlights: d.highlights ?? "",
        includes: d.includes ?? "",
        excludes: d.excludes ?? "",
        price: String(d.price ?? ""),
        discountPrice: String(d.discountPrice ?? ""),
        durationDays: String(d.durationDays ?? ""),
        maxCapacity: String(d.maxCapacity ?? ""),
        difficulty: d.difficulty ?? "",
        isActive: true, // API chi tiết không trả isActive
      });
      setEditingDestination(d.destinationName ?? "");
      setCurrentThumb(d.thumbnailUrl ?? null);
    } catch (err) {
      showToast(getErrorMessage(err, "Không lấy được chi tiết tour"), "error");
      setModalOpen(false);
      setEditingId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Vui lòng nhập tên tour");
      return;
    }
    if (!editingId && !form.destinationId) {
      setFormError("Vui lòng chọn điểm đến");
      return;
    }
    const price = Number(form.price);
    if (form.price === "" || Number.isNaN(price) || price < 0) {
      setFormError("Giá phải là số không âm");
      return;
    }
    const discountPrice = form.discountPrice === "" ? 0 : Number(form.discountPrice);
    if (Number.isNaN(discountPrice) || discountPrice < 0) {
      setFormError("Giá giảm phải là số không âm");
      return;
    }
    const durationDays = Number(form.durationDays);
    if (!Number.isInteger(durationDays) || durationDays < 1) {
      setFormError("Số ngày phải là số nguyên từ 1 trở lên");
      return;
    }
    const maxCapacity = Number(form.maxCapacity);
    if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
      setFormError("Sức chứa phải là số nguyên từ 1 trở lên");
      return;
    }

    const base = {
      title: form.title.trim(),
      description: form.description.trim(),
      highlights: form.highlights.trim(),
      includes: form.includes.trim(),
      excludes: form.excludes.trim(),
      price,
      discountPrice,
      durationDays,
      maxCapacity,
      difficulty: form.difficulty.trim(),
    };

    setSaving(true);
    try {
      const { imageError } = editingId
        ? await update(editingId, { ...base, isActive: form.isActive }, file)
        : await create({ ...base, destinationId: form.destinationId } as TourCreatePayload, file);

      showToast(editingId ? "Đã cập nhật tour" : "Đã thêm tour", "success");
      if (imageError) {
        showToast(`Đã lưu nhưng upload ảnh thất bại: ${imageError}`, "error");
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
  const handleDelete = async (t: Tour) => {
    if (!window.confirm(`Xóa tour "${t.title}"?`)) return;
    setDeletingId(t.id);
    try {
      await remove(t.id);
      showToast("Đã xóa tour", "success");
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
          <td colSpan={8} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            Đang tải dữ liệu...
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td colSpan={8} style={{ textAlign: "center", padding: 32 }}>
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
          <td colSpan={8} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            {items.length === 0 ? "Chưa có tour nào" : "Không tìm thấy kết quả phù hợp"}
          </td>
        </tr>
      );
    }
    return filtered.map((t) => (
      <tr key={t.id}>
        <td>
          {t.thumbnailUrl ? (
            <img className="td-img" src={t.thumbnailUrl} alt={t.title} />
          ) : (
            <div className="td-img">🗺️</div>
          )}
        </td>
        <td>
          <div className="td-name">{t.title}</div>
          <div className="td-sub" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.difficulty}
          </div>
        </td>
        <td>{t.destinationName || "—"}</td>
        <td>
          <div className="td-name">{fmtMoney(t.price)}</div>
          {!!t.discountPrice && <div className="td-sub">Giảm: {t.discountPrice}</div>}
        </td>
        <td>{t.durationDays} ngày</td>
        <td>{t.maxCapacity}</td>
        <td>
          {t.averageRating != null ? (
            <span className="badge badge-orange">
              ★ {t.averageRating.toFixed(1)} ({t.reviewCount})
            </span>
          ) : (
            <span className="td-sub">Chưa có</span>
          )}
        </td>
        <td>
          <div className="td-actions">
            <button className="btn btn-outline btn-sm" title="Lịch khởi hành" onClick={() => setScheduleTour(t)}>
              📅
            </button>
            <button className="btn btn-outline btn-sm" title="Sửa" onClick={() => openEdit(t.id)}>
              ✏️
            </button>
            <button
              className="btn btn-danger btn-sm"
              title="Xóa"
              disabled={deletingId === t.id}
              onClick={() => handleDelete(t)}
            >
              {deletingId === t.id ? "..." : "🗑"}
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
          <div className="section-title">Quản lý Tour</div>
          <div className="section-sub">Tổng {total} tour</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ Thêm tour
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm tour trong danh sách..."
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
              <th>Tour</th>
              <th>Điểm đến</th>
              <th>Giá</th>
              <th>Thời lượng</th>
              <th>Sức chứa</th>
              <th>Đánh giá</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>

        {!destinationFilter && totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Trang {page} / {totalPages} · {total} tour
            </div>
            <div className="pagination-btns">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
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
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal lịch khởi hành */}
      {scheduleTour && (
        <TourSchedulesModal
          tourId={scheduleTour.id}
          tourTitle={scheduleTour.title}
          onClose={() => setScheduleTour(null)}
        />
      )}

      {/* Modal thêm / sửa tour */}
      {modalOpen && (
        <div
          className="modal-backdrop open"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? "Sửa tour" : "Thêm tour"}</div>
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
                    <label className="form-label">Tên tour *</label>
                    <input
                      className="form-input"
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Điểm đến *</label>
                    {editingId ? (
                      <>
                        <input className="form-input" value={editingDestination || "—"} disabled />
                        <span className="form-hint">Không thể đổi điểm đến sau khi tạo tour</span>
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
                      <label className="form-label">Giá ($) *</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        step="any"
                        value={form.price}
                        onChange={(e) => setField("price", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giá giảm</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        step="any"
                        value={form.discountPrice}
                        onChange={(e) => setField("discountPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Số ngày *</label>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={form.durationDays}
                        onChange={(e) => setField("durationDays", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sức chứa tối đa *</label>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={form.maxCapacity}
                        onChange={(e) => setField("maxCapacity", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Độ khó / ghi chú</label>
                    <input
                      className="form-input"
                      value={form.difficulty}
                      onChange={(e) => setField("difficulty", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Điểm nổi bật</label>
                    <input
                      className="form-input"
                      placeholder="Ngăn cách bằng dấu phẩy: Vịnh Hạ Long, Hang Sửng Sốt"
                      value={form.highlights}
                      onChange={(e) => setField("highlights", e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Bao gồm</label>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: 64 }}
                        value={form.includes}
                        onChange={(e) => setField("includes", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Không bao gồm</label>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: 64 }}
                        value={form.excludes}
                        onChange={(e) => setField("excludes", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ảnh đại diện</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {preview || currentThumb ? (
                        <img
                          src={preview || currentThumb || ""}
                          alt="Xem trước"
                          style={{
                            width: 96,
                            height: 72,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                          }}
                        />
                      ) : (
                        <div className="td-img" style={{ width: 96, height: 72 }}>
                          🖼️
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                            {file ? "Chọn ảnh khác" : currentThumb ? "Đổi ảnh" : "Chọn ảnh"}
                            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                          </label>
                          {file && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setFile(null)}
                            >
                              Bỏ ảnh
                            </button>
                          )}
                        </div>
                        <span className="form-hint">
                          {file
                            ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
                            : `JPG, PNG, WEBP · tối đa ${MAX_IMAGE_MB}MB`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {editingId && (
                    <label className="form-toggle">
                      <input
                        className="toggle-input"
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setField("isActive", e.target.checked)}
                      />
                      <span className="toggle-label">Tour đang hoạt động</span>
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