import { api } from "./client";
import type { ApiResponse } from "./destinations";

export type BookingKind = "tours" | "hotels" | "attractions";

// === Kiểu dữ liệu ===
export interface TourBooking {
    id: string;
    bookingCode: string;
    tourId: string;
    tourTitle: string;
    thumbnailUrl: string | null;
    numGuests: number;
    totalPrice: number;
    status: string; // pending | confirmed | cancelled
    travelDate: string; // ISO
    createdAt: string; // ISO
}

export interface HotelBooking {
    id: string;
    bookingCode: string;
    roomId: string;
    hotelId: string;
    roomType: string;
    hotelName: string;
    thumbnailUrl: string | null;
    checkIn: string; // ISO
    checkOut: string; // ISO
    numGuests: number;
    totalPrice: number;
    status: string;
    createdAt: string;
}

export interface AttractionBooking {
  id: string;
  bookingCode: string;
  attractionId: string;
  attractionName: string;
  thumbnailUrl: string | null;
  numGuests: number;
  visitDate: string; // ISO
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface BookingMap {
    tours: TourBooking;
    hotels: HotelBooking;
    attractions: AttractionBooking;
}

export const getBookings = async<K extends BookingKind>(kind: K) => {
    const res = await api.get<ApiResponse<BookingMap[K][]>>(`/api/bookings/${kind}`);
    return res.data;
};

export const getBooking = async<K extends BookingKind>(kind: K, id:string) => {
    const res = await api.get<ApiResponse<BookingMap[K]>>(`/api/bookings/${kind}/${id}`)
};

export const cancelBooking = async (kind: BookingKind, id:string) => {
    const res = await api.post<ApiResponse<unknown>>(`/api/bookings/${kind}/${id}/cancel`)
    return res.data;
}