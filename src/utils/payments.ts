import type { PaymentAction } from "../api/payments";

const STATUS_META: Record<string, { label: string; badge: string }> = {
  pending: { label: "Chờ xử lý", badge: "badge-orange" },
  success: { label: "Thành công", badge: "badge-green" },
  failed: { label: "Thất bại", badge: "badge-red" },
  refunded: { label: "Đã hoàn tiền", badge: "badge-blue" },
};

export const getPaymentStatus = (status: string) =>
  STATUS_META[(status ?? "").toLowerCase()] ?? { label: status || "—", badge: "badge-gray" };

const BOOKING_TYPE_META: Record<string, { label: string; icon: string }> = {
  tour: { label: "Tour", icon: "🗺️" },
  hotel: { label: "Khách sạn", icon: "🏨" },
  attraction: { label: "Điểm tham quan", icon: "🎡" },
};

export const getBookingType = (type: string) =>
  BOOKING_TYPE_META[(type ?? "").toLowerCase()] ?? { label: type || "—", icon: "📋" };

// Thao tác khả dụng theo trạng thái: chờ xử lý -> xác nhận / thất bại; thành công -> hoàn tiền
export const availableActions = (status: string): PaymentAction[] => {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return ["confirm", "fail"];
  if (s === "success") return ["refund"];
  return [];
};

export const ACTION_META: Record<
  PaymentAction,
  { label: string; icon: string; btn: string; question: string; done: string }
> = {
  confirm: {
    label: "Xác nhận thanh toán",
    icon: "✓",
    btn: "btn-success",
    question: "Xác nhận giao dịch này đã thanh toán thành công?",
    done: "Đã xác nhận thanh toán",
  },
  fail: {
    label: "Đánh dấu thất bại",
    icon: "✗",
    btn: "btn-danger",
    question: "Đánh dấu giao dịch này là thất bại?",
    done: "Đã đánh dấu giao dịch thất bại",
  },
  refund: {
    label: "Hoàn tiền",
    icon: "↩",
    btn: "btn-outline",
    question: "Hoàn tiền cho giao dịch này? Hành động này không thể hoàn tác.",
    done: "Đã hoàn tiền giao dịch",
  },
};

export const isCardExpired = (month: number, year: number) => {
  const now = new Date();
  return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
};

// Hiển thị chuỗi JSON từ cổng thanh toán cho dễ đọc; không phải JSON thì giữ nguyên
export const prettyJson = (raw: string | null) => {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};