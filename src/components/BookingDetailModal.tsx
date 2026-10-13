import { useEffect, useState } from "react";
import { canCancel, fmtDateTime, fmtMoney, getStatusMeta, KIND_META, normalizeBooking, type BookingRow } from "../utils/bookings"
import { getBooking } from "../api/booking";

type Props = {
    row: BookingRow;
    onClose: () => void;
    onCancel: (row: BookingRow) => Promise<boolean>;
};

export default function BookingDetailModal({ row, onClose, onCancel }: Props) {
    const [current, setCurrent] = useState<BookingRow>(row);
    const [refreshing, setRefreshing] = useState(true);
    const [refreshError, setRefreshError] = useState("");
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getBooking(row.kind, row.id);
                if (!res.success) throw new Error(res.message || "Không tải được chi tiết");
                if (!cancelled) setCurrent(normalizeBooking(row.kind, res.data as never));
            } catch {
                if (!cancelled) setRefreshError("Không làm mới được chi tiết, đang hiển thị dữ liệu trong danh sách");
            } finally {
                if (!cancelled) setRefreshing(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [row.kind, row.id]);

    const status = getStatusMeta(current.status);
    const kindMeta = KIND_META[current.kind];

    const handleCancel = async () => {
        setCancelling(true);
        try {
            const ok = await onCancel(current);
            if (ok) onClose();
        } finally {
            setCancelling(false);
        }
    }

    return (
        <div
            className="modal-backdrop open"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal" style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <div>
                        <div className="modal-title">Chi tiết booking</div>
                        <div className="td-sub">
                            {kindMeta.icon} {kindMeta.label} · {current.code}
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div className="td-name" style={{ fontSize: 15 }}>
                            {current.title}
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
                        {[
                            { label: "Mã booking", value: current.code },
                            ...current.details,
                            { label: "Ngày đặt", value: fmtDateTime(current.createdAt) },
                        ].map((d, i) => (
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
                                <span style={{ color: "var(--text2)" }}>{d.label}</span>
                                <span style={{ fontWeight: 600, textAlign: "right" }}>{d.value}</span>
                            </div>
                        ))}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "12px 14px",
                                borderTop: "1px solid var(--border)",
                                background: "#F8F9FC",
                            }}
                        >
                            <span style={{ fontWeight: 600 }}>Tổng tiền</span>
                            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--purple)" }}>
                                {fmtMoney(current.totalPrice)}
                            </span>
                        </div>
                    </div>

                    {refreshError && <div className="form-hint">{refreshError}</div>}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose} disabled={cancelling}>
                        Đóng
                    </button>
                    {canCancel(current.status) && (
                        <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                            {cancelling ? "Đang hủy..." : "Hủy booking"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

}   