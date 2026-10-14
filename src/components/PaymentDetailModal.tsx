import { useEffect, useState } from "react";
import type { Payment, PaymentAction, PaymentDetail } from "../api/payments";
import { fmtDateTime, fmtMoney } from "../utils/bookings";
import {
  ACTION_META,
  availableActions,
  getBookingType,
  getPaymentStatus,
  prettyJson,
} from "../utils/payments";

type Props = {
  payment: Payment;
  getDetail: (id: string) => Promise<PaymentDetail>;
  // Trả về true nếu thao tác thành công (modal sẽ tự đóng)
  onAction: (p: Payment, action: PaymentAction) => Promise<boolean>;
  onClose: () => void;
};

export default function PaymentDetailModal({ payment, getDetail, onAction, onClose }: Props) {
  // Hiện ngay dữ liệu từ danh sách, rồi làm mới bằng GET /api/payments/{id} (có thêm gatewayResponse)
  const [current, setCurrent] = useState<Payment & { gatewayResponse?: string | null }>(payment);
  const [refreshing, setRefreshing] = useState(true);
  const [refreshError, setRefreshError] = useState("");
  const [busyAction, setBusyAction] = useState<PaymentAction | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await getDetail(payment.id);
        if (!cancelled) setCurrent(detail);
      } catch {
        if (!cancelled) setRefreshError("Không làm mới được chi tiết, đang hiển thị dữ liệu trong danh sách");
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payment.id, getDetail]);

  const status = getPaymentStatus(current.status);
  const type = getBookingType(current.bookingType);
  const actions = availableActions(current.status);
  const gateway = prettyJson(current.gatewayResponse ?? null);

  const rows = [
    { label: "Mã giao dịch", value: current.transactionRef || "—" },
    { label: "Loại booking", value: `${type.icon} ${type.label}` },
    { label: "Mã booking (ID)", value: current.bookingId },
    { label: "Phương thức", value: current.method || "—" },
    { label: "Người dùng (ID)", value: current.userId },
    { label: "Ngày tạo", value: fmtDateTime(current.createdAt) },
    { label: "Ngày thanh toán", value: current.paidAt ? fmtDateTime(current.paidAt) : "Chưa thanh toán" },
  ];

  const handleAction = async (action: PaymentAction) => {
    setBusyAction(action);
    try {
      const ok = await onAction(current, action);
      if (ok) onClose();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div
      className="modal-backdrop open"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Chi tiết giao dịch</div>
            <div className="td-sub">{current.transactionRef || current.id}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--purple)" }}>
              {fmtMoney(current.amount)}
            </div>
            <span className={"badge " + status.badge}>{status.label}</span>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            {rows.map((d, i) => (
              <div
                key={d.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "10px 14px",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  fontSize: 13.5,
                }}
              >
                <span style={{ color: "var(--text2)", flexShrink: 0 }}>{d.label}</span>
                <span style={{ fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>{d.value}</span>
              </div>
            ))}
          </div>

          {gateway && (
            <div className="form-group">
              <label className="form-label">Phản hồi từ cổng thanh toán</label>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: "#F8F9FC",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12.5,
                  overflowX: "auto",
                }}
              >
                {gateway}
              </pre>
            </div>
          )}

          {refreshError && <div className="form-hint">{refreshError}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={!!busyAction}>
            Đóng
          </button>
          {actions.map((a) => (
            <button
              key={a}
              className={"btn " + ACTION_META[a].btn}
              disabled={!!busyAction}
              onClick={() => handleAction(a)}
            >
              {busyAction === a ? "Đang xử lý..." : `${ACTION_META[a].icon} ${ACTION_META[a].label}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}