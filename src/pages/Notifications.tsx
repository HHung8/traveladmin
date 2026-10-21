import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useNotifications } from "../hooks/useNotification";
import { getNotificationType, KNOWN_TYPES, parseBookingAction, timeAgo } from "../utils/notifications";
import { AppNotification } from "../api/notification";
import { getErrorMessage } from "../utils/error";
import { openBooking } from "../utils/navigation";
import { fmtDateTime } from "../utils/bookings";

type Filter = "all" | "unread";
// Danh sách số trang hiển thị (tối đa 5 nút quanh trang hiện tại)
const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

export default function Notifications() {
  const { showToast } = useApp();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [q, setQ] = useState("");

  const { items, total, unreadCount, totalPages, loading, error, reload, markRead, markAllRead, remove } = useNotifications(page);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const typeOptions = useMemo(() => {
    const set = new Set<string>(KNOWN_TYPES);
    items.forEach((n) => n.type && set.add(n.type));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return items.filter((n) => {
      const matchFilter = filter === "all" || !n.isRead;
      const matchType = !typeFilter || n.type === typeFilter;
      const matchKeyword =
        !keyword ||
        n.title.toLowerCase().includes(keyword) ||
        (n.message ?? "").toLowerCase().includes(keyword);
      return matchFilter && matchType && matchKeyword;
    });
  }, [items, filter, typeFilter, q]);

  const handleMarkRead = async (n: AppNotification) => {
    setBusyId(n.id);
    try {
      await markRead(n.id);
    } catch (error) {
      showToast(getErrorMessage(error, "Đánh dấu đã đọc thất bại"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
      showToast("Đã đánh dấu tất cả là đã đọc", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Thao tác thất bại"), "error");
    } finally {
      setMarkingAll(false)
    }
  }

  const handleDelete = async (n: AppNotification) => {
    if (!window.confirm("Xoá thông báo này")) return;
    setBusyId(n.id);
    try {
      await remove(n);
      showToast("Đã xoá thành công", "success");
      if (items.length <= 1 && page > 1) setPage(page - 1);
    } catch (error) {
      showToast(getErrorMessage(error, "Xóa thông báo thất bại"), "error");
    } finally {
      setBusyId(null);
    }
  }

  // Mở booking liên quan: đánh dấu đã đọc (nếu chưa) rồi chuyển sang trang Booking
  const handleOpen = async (n: AppNotification) => {
    const action = parseBookingAction(n.actionUrl);
    if (!action) return;
    if (!n.isRead) {
      try {
        await markRead(n.id);
      } catch {
        /* không chặn việc mở booking nếu đánh dấu đã đọc lỗi */
      }
    }
    openBooking(action.kind, action.id);
  };

  const renderList = () => {
    if (loading) {
      return (
        <div className="td-sub" style={{ textAlign: "center", padding: 32 }}>
          Đang tải thông báo...
        </div>
      );
    }
    if (error) {
      return (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>
          <button className="btn btn-outline btn-sm" onClick={reload}>
            Thử lại
          </button>
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="td-sub" style={{ textAlign: "center", padding: 32 }}>
          {items.length === 0
            ? "Bạn chưa có thông báo nào"
            : filter === "unread"
              ? "Không có thông báo chưa đọc ở trang này"
              : "Không tìm thấy kết quả phù hợp"}
        </div>
      );
    }

    return filtered.map((n) => {
      const meta = getNotificationType(n.type);
      const action = parseBookingAction(n.actionUrl);
      const busy = busyId === n.id;

      return (
        <div
          key={n.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            background: n.isRead ? undefined : "#F7F7FF",
            opacity: busy ? 0.6 : 1,
          }}
        >
          <div
            className="recent-icon"
            style={{ background: meta.bg, width: 38, height: 38, fontSize: 18 }}
            title={meta.label}
          >
            {meta.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {!n.isRead && (
                <span
                  title="Chưa đọc"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--purple)",
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ fontWeight: n.isRead ? 500 : 700, color: "var(--text)" }}>{n.title}</span>
              <span className="badge badge-gray">{meta.label}</span>
            </div>
            <div style={{ color: "var(--text2)", marginTop: 3, wordBreak: "break-word" }}>{n.message}</div>
            <div className="td-sub" style={{ marginTop: 4 }} title={fmtDateTime(n.createdAt)}>
              {timeAgo(n.createdAt)}
            </div>
          </div>

          <div className="td-actions" style={{ flexShrink: 0 }}>
            {action && (
              <button className="btn btn-outline btn-sm" title="Xem booking liên quan" onClick={() => handleOpen(n)}>
                Xem booking
              </button>
            )}
            {!n.isRead && (
              <button
                className="btn btn-outline btn-sm"
                title="Đánh dấu đã đọc"
                disabled={busy}
                onClick={() => handleMarkRead(n)}
              >
                ✓
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              title="Xóa thông báo"
              disabled={busy}
              onClick={() => handleDelete(n)}
            >
              🗑
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Thông báo</div>
          <div className="section-sub">
            Tổng {total} thông báo · {unreadCount} chưa đọc
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" onClick={reload} disabled={loading}>
            ↻ Tải lại
          </button>
          <button
            className="btn btn-primary"
            onClick={handleMarkAll}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? "Đang xử lý..." : "✓ Đánh dấu tất cả đã đọc"}
          </button>
        </div>
      </div>

      <div className="tab-bar">
        <button className={"tab-btn" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>
          Tất cả ({total})
        </button>
        <button className={"tab-btn" + (filter === "unread" ? " active" : "")} onClick={() => setFilter("unread")}>
          Chưa đọc ({unreadCount})
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm trong thông báo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {getNotificationType(t).icon} {getNotificationType(t).label}
              </option>
            ))}
          </select>
        </div>

        <div>{renderList()}</div>

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Trang {page} / {totalPages} · {total} thông báo
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
    </div>
  );
}