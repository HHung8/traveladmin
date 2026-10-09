import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Hotel, HotelCreatePayload } from "../api/hotel";
import { useApp } from "../context/AppContext";
import { useHotels } from "../hooks/useHotels";
import { getErrorMessage } from "../utils/error";
import HotelRoomsModal from "../components/HotelRoomModal";

const EMPTY_FORM = {
  destinationId: "",
  name: "",
  address: "",
  starRating: "3",
  description: "",
  latitude: "",
  longitude: "",
  phone: "",
  email: "",
  website: "",
  amenities: "",
  isActive: true,
};
type FormState = typeof EMPTY_FORM;

const MAX_IMAGE_MB = 5;
const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US");
const stars = (n: number) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));

// Danh sách số trang hiển thị (tối đa 5 nút quanh trang hiện tại)
const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

export default function Hotels() {
  const { showToast } = useApp();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Dữ liệu + gọi API nằm trong hook
  const {
    items, total, totalPages, loading, error, destinations,
    reload, getDetail, create, update, remove,
  } = useHotels(page);

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
  const [roomsHotel, setRoomsHotel] = useState<Hotel | null>(null);

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
      (h) =>
        h.name.toLowerCase().includes(keyword) ||
        (h.address ?? "").toLowerCase().includes(keyword) ||
        (h.destinationName ?? "").toLowerCase().includes(keyword)
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
      // Danh sách không có phone / email / website / amenities nên lấy chi tiết
      const d = await getDetail(id);
      setForm({
        destinationId: d.destinationId ?? "",
        name: d.name ?? "",
        address: d.address ?? "",
        starRating: String(d.starRating ?? 3),
        description: d.description ?? "",
        latitude: String(d.latitude ?? ""),
        longitude: String(d.longitude ?? ""),
        phone: d.phone ?? "",
        email: d.email ?? "",
        website: d.website ?? "",
        amenities: d.amenities ?? "",
        isActive: true, // API chi tiết không trả isActive
      });
      setEditingDestination(d.destinationName ?? "");
      setCurrentThumb(d.thumbnailUrl ?? null);
    } catch (err) {
      showToast(getErrorMessage(err, "Không lấy được chi tiết khách sạn"), "error");
      setModalOpen(false);
      setEditingId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!form.name.trim() || !form.address.trim()) {
      setFormError("Vui lòng nhập tên và địa chỉ khách sạn");
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
    const email = form.email.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Email không hợp lệ");
      return;
    }

    const base = {
      name: form.name.trim(),
      address: form.address.trim(),
      starRating: Number(form.starRating),
      description: form.description.trim(),
      latitude,
      longitude,
      phone: form.phone.trim(),
      email,
      website: form.website.trim(),
      amenities: form.amenities.trim(),
    };

    setSaving(true);
    try {
      const { imageError } = editingId
        ? await update(editingId, { ...base, isActive: form.isActive }, file)
        : await create({ ...base, destinationId: form.destinationId } as HotelCreatePayload, file);

      showToast(editingId ? "Đã cập nhật khách sạn" : "Đã thêm khách sạn", "success");
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
  const handleDelete = async (h: Hotel) => {
    if (!window.confirm(`Xóa khách sạn "${h.name}"?`)) return;
    setDeletingId(h.id);
    try {
      await remove(h.id);
      showToast("Đã xóa khách sạn", "success");
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
            {items.length === 0 ? "Chưa có khách sạn nào" : "Không tìm thấy kết quả phù hợp"}
          </td>
        </tr>
      );
    }
    return filtered.map((h) => (
      <tr key={h.id}>
        <td>
          {h.thumbnailUrl ? (
            <img className="td-img" src={h.thumbnailUrl} alt={h.name} />
          ) : (
            <div className="td-img">🏨</div>
          )}
        </td>
        <td>
          <div className="td-name">{h.name}</div>
          <div
            className="td-sub"
            style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {h.address}
          </div>
        </td>
        <td>{h.destinationName || "—"}</td>
        <td style={{ color: "#F59E0B", whiteSpace: "nowrap" }}>{stars(h.starRating)}</td>
        <td>{h.minRoomPrice ? fmtMoney(h.minRoomPrice) : <span className="td-sub">—</span>}</td>
        <td>
          {h.averageRating != null ? (
            <span className="badge badge-orange">
              ★ {h.averageRating.toFixed(1)} ({h.reviewCount})
            </span>
          ) : (
            <span className="td-sub">Chưa có</span>
          )}
        </td>
        <td>
          <div className="td-actions">
            <button className="btn btn-outline btn-sm" title="Quản lý phòng" onClick={() => setRoomsHotel(h)}>
              🛏
            </button>
            <button className="btn btn-outline btn-sm" title="Sửa" onClick={() => openEdit(h.id)}>
              ✏️
            </button>
            <button
              className="btn btn-danger btn-sm"
              title="Xóa"
              disabled={deletingId === h.id}
              onClick={() => handleDelete(h)}
            >
              {deletingId === h.id ? "..." : "🗑"}
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
          <div className="section-title">Quản lý Khách sạn</div>
          <div className="section-sub">Tổng {total} khách sạn</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ Thêm khách sạn
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm theo tên, địa chỉ, điểm đến..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Khách sạn</th>
              <th>Điểm đến</th>
              <th>Hạng sao</th>
              <th>Giá từ</th>
              <th>Đánh giá</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Trang {page} / {totalPages} · {total} khách sạn
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

      {/* Modal quản lý phòng */}
      {roomsHotel && (
        <HotelRoomsModal
          hotelId={roomsHotel.id}
          hotelName={roomsHotel.name}
          onClose={() => setRoomsHotel(null)}
          onChanged={reload}
        />
      )}

      {/* Modal thêm / sửa khách sạn */}
      {modalOpen && (
        <div
          className="modal-backdrop open"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? "Sửa khách sạn" : "Thêm khách sạn"}</div>
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
                    <label className="form-label">Tên khách sạn *</label>
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
                        <span className="form-hint">Không thể đổi điểm đến sau khi tạo khách sạn</span>
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
                    <label className="form-label">Địa chỉ *</label>
                    <input
                      className="form-input"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Hạng sao *</label>
                      <select
                        className="form-select"
                        value={form.starRating}
                        onChange={(e) => setField("starRating", e.target.value)}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} sao
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        className="form-input"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        className="form-input"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input
                        className="form-input"
                        value={form.website}
                        onChange={(e) => setField("website", e.target.value)}
                      />
                    </div>
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

                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <textarea
                      className="form-textarea"
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tiện nghi</label>
                    <input
                      className="form-input"
                      placeholder="Hồ bơi, Wifi miễn phí, Bữa sáng..."
                      value={form.amenities}
                      onChange={(e) => setField("amenities", e.target.value)}
                    />
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
                      <span className="toggle-label">Khách sạn đang hoạt động</span>
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