import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { BOOKING_KINDS, useBookings } from "../hooks/useBooking";
import { BookingKind } from "../api/booking";
import { BookingRow, canCancel, fmtDateTime, fmtMoney, getStatusMeta, KIND_META } from "../utils/bookings";
import { getErrorMessage } from "../utils/error";
import BookingDetailModal from "../components/BookingDetailModal";


const PAGE_SIZE = 10;

const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
}

function Thumb({ url, icon }: { url: string | null; icon: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) return <div className="td-img">{icon}</div>;
  return <img className="td-img" src={url} alt="" onError={() => setBroken(true)} />;
}


export default function Booking() {
  const { showToast } = useApp();
  const { rows, errors, loading, reload, cancel } = useBookings();

  const [kind, setKind] = useState<BookingKind>("tours");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [kind, q, statusFilter]);

  const current = rows[kind];

  const stats = useMemo(() => {
    const count = (s: string) => current.filter((r) => r.status.toLocaleLowerCase() === s).length;
    const revenue = current
      .filter((r) => r.status.toLowerCase() === "confirmed")
      .reduce((sum, r) => sum + r.totalPrice, 0);
    return { total: current.length, pending: count("pending"), confirmed: count("confirmed"), revenue };
  }, [current]);


  const filtered = useMemo(() => {
    const keyword = q.trim().toLocaleLowerCase();
    return current.filter((r) => {
      const matchStatus = !statusFilter || r.status.toLocaleLowerCase() === statusFilter;
      const matchKeyword =
        !keyword ||
        r.code.toLowerCase().includes(keyword) ||
        r.title.toLowerCase().includes(keyword) ||
        r.subtitle.toLowerCase().includes(keyword);
      return matchStatus && matchKeyword;
    });
  }, [current, q, statusFilter]);


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hanleCancel = async (row: BookingRow): Promise<boolean> => {
    if (!window.confirm(`Hủy booking ${row.code}? Hành động này không thể hoàn tác.`)) return false;
    setCancellingId(row.id);
    try {
      await cancel(row.kind, row.id);
      showToast("Đã hủy booking", "success");
      return true;
    } catch (err) {
      showToast(getErrorMessage(err, "Hủy booking thất bại"), "error");
      return false;
    } finally {
      setCancellingId(null);
    }
  }

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
    if (errors[kind]) {
      return (
        <tr>
          <td colSpan={8} style={{ textAlign: "center", padding: 32 }}>
            <div style={{ color: "var(--red)", marginBottom: 10 }}>{errors[kind]}</div>
            <button className="btn btn-outline btn-sm" onClick={reload}>
              Thử lại
            </button>
          </td>
        </tr>
      );
    }
    if (pageRows.length === 0) {
      return (
        <tr>
          <td colSpan={8} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            {current.length === 0 ? "Chưa có booking nào" : "Không tìm thấy kết quả phù hợp"}
          </td>
        </tr>
      );
    }
    return pageRows.map((r) => {
      const status = getStatusMeta(r.status);
      return (
        <tr key={r.id}>
          <td>
            <div className="td-name" style={{ whiteSpace: "nowrap" }}>
              {r.code}
            </div>
          </td>
          <td>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Thumb key={r.thumbnailUrl ?? "none"} url={r.thumbnailUrl} icon={KIND_META[r.kind].icon} />
              <div style={{ minWidth: 0 }}>
                <div
                  className="td-name"
                  style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {r.title}
                </div>
                {r.subtitle && <div className="td-sub">{r.subtitle}</div>}
              </div>
            </div>
          </td>
          <td style={{ whiteSpace: "nowrap" }}>{r.scheduleText}</td>
          <td>{r.guests}</td>
          <td>
            <div className="td-name">{fmtMoney(r.totalPrice)}</div>
          </td>
          <td>
            <span className={"badge " + status.badge}>{status.label}</span>
          </td>
          <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.createdAt)}</td>
          <td>
            <div className="td-actions">
              <button className="btn btn-outline btn-sm" title="Xem chi tiết" onClick={() => setSelected(r)}>
                👁
              </button>
              {canCancel(r.status) && (
                <button
                  className="btn btn-danger btn-sm"
                  title="Hủy booking"
                  disabled={cancellingId === r.id}
                  onClick={() => hanleCancel(r)}
                >
                  {cancellingId === r.id ? "..." : "✖"}
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  const statCards = [
    { label: "Tổng booking", value: String(stats.total), icon: "📋", bg: "#EEF2FF" },
    { label: "Chờ xác nhận", value: String(stats.pending), icon: "⏳", bg: "#FEF3C7" },
    { label: "Đã xác nhận", value: String(stats.confirmed), icon: "✅", bg: "#E6F4EA" },
    { label: "Doanh thu (đã xác nhận)", value: fmtMoney(stats.revenue), icon: "💰", bg: "#EEF2FF" },
  ];

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Quản lý Bookings</div>
          <div className="section-sub">
            {KIND_META[kind].label}: {current.length} booking
          </div>
        </div>
        <button className="btn btn-outline" onClick={reload} disabled={loading}>
          {loading ? "Đang tải..." : "↻ Tải lại"}
        </button>
      </div>

      <div className="stats-grid">
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

      <div className="tab-bar">
        {BOOKING_KINDS.map((k) => (
          <button
            key={k}
            className={"tab-btn" + (k === kind ? " active" : "")}
            onClick={() => setKind(k)}
          >
            {KIND_META[k].icon} {KIND_META[k].label} ({rows[k].length})
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm theo mã booking hoặc tên dịch vụ..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Mã booking</th>
              <th>Dịch vụ</th>
              <th>Lịch trình</th>
              <th>Số khách</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>

        {!loading && totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Trang {safePage} / {totalPages} · {filtered.length} booking
            </div>
            <div className="pagination-btns">
              <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                ‹
              </button>
              {getPageNumbers(safePage, totalPages).map((n) => (
                <button
                  key={n}
                  className={"page-btn" + (n === safePage ? " active" : "")}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <BookingDetailModal
          row={selected}
          onClose={() => setSelected(null)}
          onCancel={hanleCancel}
        />
      )}
    </div>
  );

}