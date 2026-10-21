import type { BookingKind } from "../api/booking";
import { fmtDateTime } from "./bookings";

const TYPE_META: Record<string, { icon: string; label: string; bg: string }> = {
    booking_success: { icon: "📋", label: "Đặt chỗ", bg: "#EEF2FF" },
    booking_cancelled: { icon: "❌", label: "Hủy đặt chỗ", bg: "#FEE2E2" },
    payment_success: { icon: "💰", label: "Thanh toán", bg: "#E6F4EA" },
    payment_failed: { icon: "⚠️", label: "Thanh toán lỗi", bg: "#FEF3C7" },
    payment_refunded: { icon: "↩️", label: "Hoàn tiền", bg: "#EFF6FF" },
}

export const getNotificationType = (type: string) => TYPE_META[type] ?? { icon: "🔔", label: type || "Khác", bg: "#F1F3F5" }

export const KNOWN_TYPES = Object.keys(TYPE_META);

export const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diff)) return "";
    const min = Math.floor(diff / 60000);
    if (min < 1) return "Vừa xong";
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;
    const day = Math.floor(hour / 24);
    if (day < 7) return `${day} ngày trước`;
    return fmtDateTime(iso);
};

const KIND_BY_TYPE: Record<string, BookingKind> = {
    tour: "tours",
    hotel: "hotels",
    attraction: "attractions",
};

export const parseBookingAction = (actionUrl: string | null) => {
    if (!actionUrl) return null;
    const [path, query = ""] = actionUrl.split("?");
    if (path !== "booking-detail") return null;
    const params = new URLSearchParams(query);
    const kind = KIND_BY_TYPE[(params.get("type") ?? "").toLowerCase()];
    const id = params.get("bookingId");
    return kind && id ? { kind, id } : null;
}