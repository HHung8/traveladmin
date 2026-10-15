import { useState } from "react";
import { ReviewSummary } from "../api/reviews"
import { useApp } from "../context/AppContext";
import { useReviewDetail } from "../hooks/useReviewDetails";
import { getTargetType, normalizeReviewImages, starts } from "../utils/reviews";
import { fmtDateTime, normalizeBooking } from "../utils/bookings";
import { getErrorMessage } from "../utils/error";
import { getInitials } from "../utils/user";


type Props = {
    review: ReviewSummary;
    onDelete: (review: ReviewSummary) => Promise<boolean>;
    onClose: () => void;
}

export default function ReviewDetailModal({ review, onDelete, onClose }: Props) {
    const { showToast } = useApp();
    const { detail, loading, error, removeImage } = useReviewDetail(review.id);

    const [deleting, setDeleting] = useState(false);
    const [busyImage, setBusyImage] = useState<string | null>(null);

    const current: ReviewSummary = { ...review, ...(detail ?? {}) };
    const type = getTargetType(current.targetType);
    const images = normalizeReviewImages(detail?.images);
    const name = current.userName || "Người dùng";

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const ok = await onDelete(current);
            if (ok) onClose();
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!window.confirm("Xóa ảnh này khỏi đánh giá?")) return;
        setBusyImage(imageId);
        try {
            await removeImage(imageId);
            showToast("Đã xóa ảnh", "success");
        } catch (err) {
            showToast(getErrorMessage(err, "Xóa ảnh thất bại"), "error");
        } finally {
            setBusyImage(null);
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
                        <div className="modal-title">Chi tiết đánh giá</div>
                        <div className="td-sub">
                            {type.icon} {type.label}
                            {current.targetTitle ? ` · ${current.targetTitle}` : ""}
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {current.avatarUrl ? (
                            <img
                                src={current.avatarUrl}
                                alt={name}
                                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                            />
                        ) : (
                            <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                                {getInitials(name)}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="td-name">{name}</div>
                            <div className="td-sub">{fmtDateTime(current.createdAt)}</div>
                        </div>
                        {current.isVerified && <span className="badge badge-green">Đã xác thực</span>}
                    </div>

                    <div style={{ color: "#F59E0B", fontSize: 20, letterSpacing: 2 }}>
                        {starts(current.rating)}
                        <span style={{ color: "var(--text2)", fontSize: 13, marginLeft: 8, letterSpacing: 0 }}>
                            {current.rating}/5
                        </span>
                    </div>

                    <div
                        style={{
                            padding: "12px 14px",
                            background: "#F8F9FC",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: 14,
                        }}
                    >
                        {current.comment || <span className="td-sub">Không có nội dung</span>}
                    </div>

                    {loading && <div className="form-hint">Đang tải ảnh đánh giá...</div>}
                    {error && !loading && <div className="form-hint">{error}</div>}

                    {images.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Ảnh đính kèm ({images.length})</label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
                                {images.map((img, i) => (
                                    <div
                                        key={img.id ?? img.url + i}
                                        style={{
                                            position: "relative",
                                            border: "1px solid var(--border)",
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            opacity: busyImage === img.id ? 0.5 : 1,
                                        }}
                                    >
                                        <a href={img.url} target="_blank" rel="noreferrer">
                                            <img
                                                src={img.url}
                                                alt=""
                                                style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }}
                                            />
                                        </a>
                                        {img.id && (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                title="Xóa ảnh"
                                                style={{ position: "absolute", top: 4, right: 4 }}
                                                disabled={busyImage === img.id}
                                                onClick={() => handleDeleteImage(img.id as string)}
                                            >
                                                🗑
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose} disabled={deleting}>
                        Đóng
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Đang xóa..." : "🗑 Xóa đánh giá"}
                    </button>
                </div>
            </div>
        </div>
    );



}