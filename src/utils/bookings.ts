import { AttractionBooking, BookingKind, BookingMap, HotelBooking, TourBooking } from "../api/booking";


// ===== Định dạng =====
export const fmtMoney = (n: number) => "$" + n.toLocaleString("en-US");
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

// ===== Trạng thái / loại booking =====
const STATUS_META: Record<string, { label: string; badge: string }> = {
  pending: { label: "Chờ xác nhận", badge: "badge-orange" },
  confirmed: { label: "Đã xác nhận", badge: "badge-green" },
  cancelled: { label: "Đã hủy", badge: "badge-red" },
};

export const getStatusMeta = (status: string) =>
  STATUS_META[(status ?? "").toLowerCase()] ?? { label: status || "—", badge: "badge-gray" };

// Chỉ booking đang chờ hoặc đã xác nhận mới hủy được
export const canCancel = (status: string) =>
  ["pending", "confirmed"].includes((status ?? "").toLowerCase());

export const KIND_META: Record<BookingKind, { label: string; icon: string }> = {
  tours: { label: "Tour", icon: "🗺️" },
  hotels: { label: "Khách sạn", icon: "🏨" },
  attractions: { label: "Điểm tham quan", icon: "🎡" },
};

// ===== Dòng booking dùng chung cho cả 3 loại =====
export interface BookingRow {
  id: string;
  kind: BookingKind;
  code: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string | null;
  scheduleText: string;
  guests: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  details: { label: string; value: string }[];
}

export function normalizeBooking<K extends BookingKind>(kind: K, raw: BookingMap[K]): BookingRow {
  if (kind === "tours") {
    const b = raw as TourBooking;
    return {
      id: b.id,
      kind,
      code: b.bookingCode,
      title: b.tourTitle,
      subtitle: "",
      thumbnailUrl: b.thumbnailUrl,
      scheduleText: fmtDateTime(b.travelDate),
      guests: b.numGuests,
      totalPrice: b.totalPrice,
      status: b.status,
      createdAt: b.createdAt,
      details: [
        { label: "Tour", value: b.tourTitle },
        { label: "Ngày khởi hành", value: fmtDateTime(b.travelDate) },
        { label: "Số khách", value: String(b.numGuests) },
      ],
    };
  }

  if (kind === "hotels") {
    const b = raw as HotelBooking;
    const nights = Math.max(
      0,
      Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000)
    );
    return {
      id: b.id,
      kind,
      code: b.bookingCode,
      title: b.hotelName,
      subtitle: b.roomType,
      thumbnailUrl: b.thumbnailUrl,
      scheduleText: `${fmtDay(b.checkIn)} → ${fmtDay(b.checkOut)} (${nights} đêm)`,
      guests: b.numGuests,
      totalPrice: b.totalPrice,
      status: b.status,
      createdAt: b.createdAt,
      details: [
        { label: "Khách sạn", value: b.hotelName },
        { label: "Loại phòng", value: b.roomType },
        { label: "Nhận phòng", value: fmtDay(b.checkIn) },
        { label: "Trả phòng", value: fmtDay(b.checkOut) },
        { label: "Số đêm", value: String(nights) },
        { label: "Số khách", value: String(b.numGuests) },
      ],
    };
  }

  const b = raw as AttractionBooking;
  return {
    id: b.id,
    kind,
    code: b.bookingCode,
    title: b.attractionName,
    subtitle: "",
    thumbnailUrl: b.thumbnailUrl,
    scheduleText: fmtDateTime(b.visitDate),
    guests: b.numGuests,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt,
    details: [
      { label: "Điểm tham quan", value: b.attractionName },
      { label: "Ngày tham quan", value: fmtDateTime(b.visitDate) },
      { label: "Số khách", value: String(b.numGuests) },
    ],
  };
}