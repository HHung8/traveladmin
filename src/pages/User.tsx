import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { getInitials } from "../utils/user";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useMyProfile } from "../hooks/useMyProfile";
import { useDebounce } from "../hooks/useDebounce";
import { UserListItem } from "../api/user";
import { getErrorMessage } from "../utils/error";
import { fmtDateTime } from "../utils/bookings";
import UserDetailModal from "../components/useDetailModal";


type Tab = "users" | "profile";

const MAX_IMAGE_MB = 5;

// Danh sách số trang hiển thị (tối đa 5 nút quanh trang hiện tại)
const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

function Avatar({
  name,
  url,
  size = 32,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setBroken(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      className="user-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {getInitials(name)}
    </div>
  );
}

const RoleBadge = ({ role }: { role: string }) =>
  role === "admin" ? (
    <span className="badge badge-purple">Quản trị viên</span>
  ) : (
    <span className="badge badge-gray">Người dùng</span>
  );

export default function User() {
  const { showToast } = useApp();
  // updateUser (nếu AuthContext có) giúp tên / ảnh trên thanh trên cập nhật ngay sau khi sửa hồ sơ
  const { updateUser } = useAuth() as ReturnType<typeof useAuth> & {
    updateUser?: (patch: Record<string, unknown>) => void;
  };

  const [tab, setTab] = useState<Tab>("users");

  // ===== Hồ sơ của tôi (tải sẵn để biết ai là "Bạn" trong danh sách) =====
  const me = useMyProfile();

  // ===== Danh sách người dùng =====
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");
  const debouncedKeyword = useDebounce(keyword, 400);

  // Đổi từ khóa / bộ lọc thì về trang 1
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, role, isActive]);

  const { items, total, totalPages, loading, error, reload } = useUsers({
    page,
    keyword: debouncedKeyword,
    role,
    isActive,
  });

  const [selected, setSelected] = useState<UserListItem | null>(null);

  // Thống kê trên trang đang xem (API không trả tổng theo vai trò / trạng thái)
  const stats = useMemo(
    () => ({
      admins: items.filter((u) => u.role === "admin").length,
      locked: items.filter((u) => !u.isActive).length,
    }),
    [items]
  );

  // ===== Form hồ sơ =====
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Nạp dữ liệu vào form mỗi khi hồ sơ tải xong / thay đổi
  useEffect(() => {
    if (me.profile) {
      setFullName(me.profile.fullName ?? "");
      setPhone(me.profile.phone ?? "");
    }
  }, [me.profile]);

  const dirty =
    !!me.profile &&
    (fullName.trim() !== (me.profile.fullName ?? "") || phone.trim() !== (me.profile.phone ?? ""));

  const handleSaveProfile = async () => {
    setFormError("");
    if (!fullName.trim()) {
      setFormError("Vui lòng nhập họ và tên");
      return;
    }
    const phoneValue = phone.trim();
    if (phoneValue && !/^[0-9+\-\s()]{8,20}$/.test(phoneValue)) {
      setFormError("Số điện thoại không hợp lệ");
      return;
    }

    setSaving(true);
    try {
      const fresh = await me.save({ fullName: fullName.trim(), phoneNumber: phoneValue });
      if (fresh) updateUser?.({ fullName: fresh.fullName, phone: fresh.phone });
      showToast("Đã cập nhật hồ sơ", "success");
    } catch (err) {
      setFormError(getErrorMessage(err, "Cập nhật hồ sơ thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn file ảnh (JPG, PNG, WEBP...)", "error");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showToast(`Ảnh tối đa ${MAX_IMAGE_MB}MB`, "error");
      return;
    }
    setUploading(true);
    try {
      const fresh = await me.changeAvatar(file);
      if (fresh) updateUser?.({ avatarUrl: fresh.avatarUrl });
      showToast("Đã cập nhật ảnh đại diện", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "Upload ảnh thất bại"), "error");
    } finally {
      setUploading(false);
    }
  };

  // ===== Giao diện: danh sách =====
  const renderRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            Đang tải dữ liệu...
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
            <div style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>
            <button className="btn btn-outline btn-sm" onClick={reload}>
              Thử lại
            </button>
          </td>
        </tr>
      );
    }
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={6} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            Không tìm thấy người dùng nào
          </td>
        </tr>
      );
    }
    return items.map((u) => (
      <tr key={u.id}>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={u.fullName || u.email} url={u.avatarUrl} />
            <div style={{ minWidth: 0 }}>
              <div className="td-name">
                {u.fullName}{" "}
                {me.profile?.id === u.id && <span className="badge badge-purple">Bạn</span>}
              </div>
              <div className="td-sub">{u.email}</div>
            </div>
          </div>
        </td>
        <td>{u.phoneNumber || <span className="td-sub">—</span>}</td>
        <td>
          <RoleBadge role={u.role} />
        </td>
        <td>
          {u.isActive ? (
            <span className="badge badge-green">Hoạt động</span>
          ) : (
            <span className="badge badge-red">Đã khóa</span>
          )}
        </td>
        <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(u.createdAt)}</td>
        <td>
          <div className="td-actions">
            <button className="btn btn-outline btn-sm" title="Xem chi tiết" onClick={() => setSelected(u)}>
              👁
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const statCards = [
    { label: "Tổng người dùng", value: String(total), icon: "👥", bg: "#EEF2FF" },
    { label: "Quản trị viên (trang này)", value: String(stats.admins), icon: "🛡️", bg: "#EEEDFE" },
    { label: "Đã khóa (trang này)", value: String(stats.locked), icon: "🔒", bg: "#FEE2E2" },
  ];

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Quản lý Người dùng</div>
          <div className="section-sub">
            {tab === "users" ? `Tổng ${total} người dùng` : "Thông tin tài khoản của bạn"}
          </div>
        </div>
        <button
          className="btn btn-outline"
          onClick={tab === "users" ? reload : me.reload}
          disabled={tab === "users" ? loading : me.loading}
        >
          ↻ Tải lại
        </button>
      </div>

      <div className="tab-bar">
        <button className={"tab-btn" + (tab === "users" ? " active" : "")} onClick={() => setTab("users")}>
          👥 Người dùng
        </button>
        <button className={"tab-btn" + (tab === "profile" ? " active" : "")} onClick={() => setTab("profile")}>
          👤 Hồ sơ của tôi
        </button>
      </div>

      {tab === "users" ? (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {statCards.map((s) => (
              <div className="stat-card" key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-icon" style={{ background: s.bg }}>
                    {s.icon}
                  </div>
                </div>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="table-wrap">
            <div className="table-toolbar">
              <input
                className="search-input"
                type="text"
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <select className="filter-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Tất cả vai trò</option>
                <option value="admin">Quản trị viên</option>
                <option value="user">Người dùng</option>
              </select>
              <select
                className="filter-select"
                value={isActive}
                onChange={(e) => setIsActive(e.target.value as "" | "true" | "false")}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>{renderRows()}</tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Trang {page} / {totalPages} · {total} người dùng
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
        </>
      ) : (
        <div className="chart-card" style={{ maxWidth: 640 }}>
          {me.loading && !me.profile ? (
            <div className="td-sub" style={{ textAlign: "center", padding: 24 }}>
              Đang tải hồ sơ...
            </div>
          ) : me.error && !me.profile ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ color: "var(--red)", marginBottom: 10 }}>{me.error}</div>
              <button className="btn btn-outline btn-sm" onClick={me.reload}>
                Thử lại
              </button>
            </div>
          ) : me.profile ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <Avatar
                  key={me.profile.avatarUrl ?? "none"}
                  name={me.profile.fullName || me.profile.email}
                  url={me.profile.avatarUrl}
                  size={72}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{me.profile.fullName}</div>
                  <div className="td-sub" style={{ marginBottom: 6 }}>
                    {me.profile.email}
                  </div>
                  <RoleBadge role={me.profile.role} />
                </div>
                <label
                  className="btn btn-outline btn-sm"
                  style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
                >
                  {uploading ? "Đang tải lên..." : "Đổi ảnh"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploading}
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    className="form-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={me.profile.email} disabled />
                    <span className="form-hint">Không thể đổi email</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vai trò</label>
                    <input
                      className="form-input"
                      value={me.profile.role === "admin" ? "Quản trị viên" : "Người dùng"}
                      disabled
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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    className="btn btn-outline"
                    disabled={!dirty || saving}
                    onClick={() => {
                      setFullName(me.profile?.fullName ?? "");
                      setPhone(me.profile?.phone ?? "");
                      setFormError("");
                    }}
                  >
                    Hoàn tác
                  </button>
                  <button className="btn btn-purple" disabled={!dirty || saving} onClick={handleSaveProfile}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {selected && (
        <UserDetailModal
          user={selected}
          isMe={me.profile?.id === selected.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}