import { useState } from "react";
import { UserListItem } from "../api/user"
import { fmtDateTime } from "../utils/bookings";
import { getInitials } from "../utils/user";

type Props = {
    user: UserListItem;
    isMe: boolean;
    onClose: () => void;
}

export default function UserDetailModal({ user, isMe, onClose }: Props) {
    const [broken, setBroken] = useState(false);
    const rows = [
        { label: "Email", value: user.email },
        { label: "Số điện thoại", value: user.phoneNumber || "—" },
        { label: "Vai trò", value: user.role === "admin" ? "Quản trị viên" : "Người dùng" },
        { label: "Trạng thái", value: user.isActive ? "Đang hoạt động" : "Đã khóa" },
        { label: "Ngày tạo", value: fmtDateTime(user.createdAt) },
        { label: "ID", value: user.id },
    ]

    return (
        <div
            className="modal-backdrop open"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal" style={{ maxWidth: 480 }}>
                <div className="modal-header">
                    <div className="modal-title">Thông tin người dùng</div>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {user.avatarUrl && !broken ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.fullName}
                                onError={() => setBroken(true)}
                                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
                            />
                        ) : (
                            <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
                                {getInitials(user.fullName || user.email)}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>
                                {user.fullName}{" "}
                                {isMe && <span className="badge badge-purple">Bạn</span>}
                            </div>
                            <div className="td-sub">{user.email}</div>
                        </div>
                    </div>

                    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
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
                </div>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}