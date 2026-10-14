import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { usePayments } from "../hooks/usePayment";
import { Payment, PaymentAction, PaymentMethod } from "../api/payments";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { ACTION_META, availableActions, getBookingType, getPaymentStatus, isCardExpired } from "../utils/payments";
import { getErrorMessage } from "../utils/error";
import { fmtDateTime, fmtMoney } from "../utils/bookings";
import PaymentDetailModal from "../components/PaymentDetailModal";

type Tab = "payments" | "methods";

// Danh sách số trang hiển thị (tối đa 5 nút quanh trang hiện tại)
const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

const shortId = (id: string) => (id ? id.slice(0, 8) + "…" : "—");

export default function Payments() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<Tab>("payments");
  // ===== Tab giao dịch =====
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { items, total, totalPages, loading, error, reload, getDetail, act } = usePayments(page);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ===== Tab thẻ đã lưu =====
  const pm = usePaymentMethods();
  const [methodBusyId, setMethodBusyId] = useState<string | null>(null);

  // Thống kê trên trang đang xem (API không trả tổng theo trạng thái)
  const stats = useMemo(() => {
    const by = (s: string) => items.filter((p) => p.status.toLowerCase() === s);
    const success = by("success");
    return {
      revenue: success.reduce((sum, p) => sum + p.amount, 0),
      pending: by("pending").length,
      problem: by("failed").length + by("refunded").length,
    };
  }, [items]);

  // Lọc + tìm kiếm trên trang đang xem
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return items.filter((p) => {
      const matchStatus = !statusFilter || p.status.toLowerCase() === statusFilter;
      const matchType = !typeFilter || p.bookingType.toLowerCase() === typeFilter;
      const matchKeyword =
        !keyword ||
        (p.transactionRef ?? "").toLowerCase().includes(keyword) ||
        p.bookingId.toLowerCase().includes(keyword) ||
        (p.method ?? "").toLowerCase().includes(keyword);
      return matchStatus && matchType && matchKeyword;
    });
  }, [items, q, statusFilter, typeFilter]);

  // ===== Thao tác trên giao dịch =====
  const handleAction = async (p: Payment, action: PaymentAction): Promise<boolean> => {
    const meta = ACTION_META[action];
    if (!window.confirm(meta.question)) return false;
    setBusyId(p.id);
    try {
      await act(p.id, action);
      showToast(meta.done, "success");
      return true;
    } catch (err) {
      showToast(getErrorMessage(err, "Thao tác thất bại"), "error");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  // ===== Thao tác trên thẻ =====
  const handleSetDefault = async (m: PaymentMethod) => {
    setMethodBusyId(m.id);
    try {
      await pm.setDefault(m.id);
      showToast("Đã đặt làm thẻ mặc định", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "Đặt mặc định thất bại"), "error");
    } finally {
      setMethodBusyId(null);
    }
  };

  const handleDeleteMethod = async (m: PaymentMethod) => {
    if (!window.confirm(`Xóa thẻ ${m.brand} •••• ${m.last4}?`)) return;
    setMethodBusyId(m.id);
    try {
      await pm.remove(m.id);
      showToast("Đã xóa thẻ", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "Xóa thẻ thất bại"), "error");
    } finally {
      setMethodBusyId(null);
    }
  };

  // ===== Giao diện: giao dịch =====
  const renderPaymentRows = () => {
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
            {items.length === 0 ? "Chưa có giao dịch nào" : "Không tìm thấy kết quả phù hợp"}
          </td>
        </tr>
      );
    }
    return filtered.map((p) => {
      const status = getPaymentStatus(p.status);
      const type = getBookingType(p.bookingType);
      const actions = availableActions(p.status);
      return (
        <tr key={p.id}>
          <td>
            <div className="td-name" style={{ whiteSpace: "nowrap" }}>
              {p.transactionRef || <span className="td-sub">Chưa có mã</span>}
            </div>
            <div className="td-sub" title={p.bookingId}>
              Booking: {shortId(p.bookingId)}
            </div>
          </td>
          <td style={{ whiteSpace: "nowrap" }}>
            {type.icon} {type.label}
          </td>
          <td>
            <div className="td-name">{fmtMoney(p.amount)}</div>
          </td>
          <td>{p.method || "—"}</td>
          <td>
            <span className={"badge " + status.badge}>{status.label}</span>
          </td>
          <td style={{ whiteSpace: "nowrap" }}>
            <div>{fmtDateTime(p.createdAt)}</div>
            <div className="td-sub">{p.paidAt ? "Trả: " + fmtDateTime(p.paidAt) : "Chưa thanh toán"}</div>
          </td>
          <td>
            <div className="td-actions">
              <button className="btn btn-outline btn-sm" title="Xem chi tiết" onClick={() => setSelected(p)}>
                👁
              </button>
              {actions.map((a) => (
                <button
                  key={a}
                  className={"btn btn-sm " + ACTION_META[a].btn}
                  title={ACTION_META[a].label}
                  disabled={busyId === p.id}
                  onClick={() => handleAction(p, a)}
                >
                  {busyId === p.id ? "..." : ACTION_META[a].icon}
                </button>
              ))}
            </div>
          </td>
        </tr>
      );
    });
  };

  // ===== Giao diện: thẻ đã lưu =====
  const renderMethodRows = () => {
    if (pm.loading) {
      return (
        <tr>
          <td colSpan={5} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            Đang tải dữ liệu...
          </td>
        </tr>
      );
    }
    if (pm.error) {
      return (
        <tr>
          <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
            <div style={{ color: "var(--red)", marginBottom: 10 }}>{pm.error}</div>
            <button className="btn btn-outline btn-sm" onClick={pm.reload}>
              Thử lại
            </button>
          </td>
        </tr>
      );
    }
    if (pm.methods.length === 0) {
      return (
        <tr>
          <td colSpan={5} style={{ textAlign: "center", padding: 32 }} className="td-sub">
            Chưa có thẻ nào được lưu
          </td>
        </tr>
      );
    }
    return pm.methods.map((m) => {
      const expired = isCardExpired(m.expiryMonth, m.expiryYear);
      return (
        <tr key={m.id}>
          <td>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="td-img">💳</div>
              <div>
                <div className="td-name">{m.brand}</div>
                <div className="td-sub">•••• •••• •••• {m.last4}</div>
              </div>
            </div>
          </td>
          <td style={{ whiteSpace: "nowrap" }}>
            {String(m.expiryMonth).padStart(2, "0")}/{m.expiryYear}{" "}
            {expired && <span className="badge badge-red">Hết hạn</span>}
          </td>
          <td>
            {m.isDefault ? (
              <span className="badge badge-purple">Mặc định</span>
            ) : (
              <span className="td-sub">—</span>
            )}
          </td>
          <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(m.createdAt)}</td>
          <td>
            <div className="td-actions">
              {!m.isDefault && (
                <button
                  className="btn btn-outline btn-sm"
                  disabled={methodBusyId === m.id}
                  onClick={() => handleSetDefault(m)}
                >
                  Đặt mặc định
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                title="Xóa thẻ"
                disabled={methodBusyId === m.id}
                onClick={() => handleDeleteMethod(m)}
              >
                {methodBusyId === m.id ? "..." : "🗑"}
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  const statCards = [
    { label: "Tổng giao dịch", value: String(total), icon: "💳", bg: "#EEF2FF" },
    { label: "Doanh thu thành công (trang này)", value: fmtMoney(stats.revenue), icon: "💰", bg: "#E6F4EA" },
    { label: "Chờ xử lý (trang này)", value: String(stats.pending), icon: "⏳", bg: "#FEF3C7" },
    { label: "Thất bại / hoàn tiền (trang này)", value: String(stats.problem), icon: "↩️", bg: "#FEE2E2" },
  ];

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Quản lý Thanh toán</div>
          <div className="section-sub">
            {tab === "payments" ? `Tổng ${total} giao dịch` : `${pm.methods.length} thẻ đã lưu`}
          </div>
        </div>
        <button
          className="btn btn-outline"
          onClick={tab === "payments" ? reload : pm.reload}
          disabled={tab === "payments" ? loading : pm.loading}
        >
          ↻ Tải lại
        </button>
      </div>

      <div className="tab-bar">
        <button
          className={"tab-btn" + (tab === "payments" ? " active" : "")}
          onClick={() => setTab("payments")}
        >
          💳 Giao dịch
        </button>
        <button
          className={"tab-btn" + (tab === "methods" ? " active" : "")}
          onClick={() => setTab("methods")}
        >
          🏦 Thẻ đã lưu
        </button>
      </div>

      {tab === "payments" ? (
        <>
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

          <div className="table-wrap">
            <div className="table-toolbar">
              <input
                className="search-input"
                type="text"
                placeholder="Tìm theo mã giao dịch, mã booking..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="success">Thành công</option>
                <option value="failed">Thất bại</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
              <select
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Tất cả loại</option>
                <option value="tour">Tour</option>
                <option value="hotel">Khách sạn</option>
                <option value="attraction">Điểm tham quan</option>
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Giao dịch</th>
                  <th>Loại</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>{renderPaymentRows()}</tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Trang {page} / {totalPages} · {total} giao dịch
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Thẻ</th>
                <th>Hạn dùng</th>
                <th>Mặc định</th>
                <th>Ngày thêm</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>{renderMethodRows()}</tbody>
          </table>
        </div>
      )}

      {selected && (
        <PaymentDetailModal
          payment={selected}
          getDetail={getDetail}
          onAction={handleAction}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}