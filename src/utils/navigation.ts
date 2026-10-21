import type { BookingKind } from "../api/booking";
import type { PageKey } from "../components/Sidebar";

export const navigateAdmin = (page: PageKey) => {
    window.dispatchEvent(new CustomEvent<PageKey>("admin:navigate", {detail: page}));
};

export const BOOKING_FOCUS_KEY = "booking-focus";
export const openBooking = (kind: BookingKind, id: string) => {
    try {
        sessionStorage.setItem(BOOKING_FOCUS_KEY, JSON.stringify({kind, id}));
    } catch (error) {
        
    }
    navigateAdmin("bookings");
}