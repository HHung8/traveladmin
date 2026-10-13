import { useCallback, useEffect, useState } from "react";
import { cancelBooking, getBookings, type BookingKind } from "../api/booking";
import { normalizeBooking, type BookingRow } from "../utils/bookings";
import { getErrorMessage } from "../utils/error";

export const BOOKING_KINDS: BookingKind[] = ["tours", "hotels", "attractions"];

type RowsByKind = Record<BookingKind, BookingRow[]>;
type ErrorsByKind = Record<BookingKind, string>;

const emptyRows = (): RowsByKind => ({ tours: [], hotels: [], attractions: [] });
const emptyErrors = (): ErrorsByKind => ({ tours: "", hotels: "", attractions: "" });

async function fetchRows(kind: BookingKind): Promise<BookingRow[]> {
    const res = await getBookings(kind);
    if (!res.success) throw new Error(res.message || "Không tải được danh sách booking");
    return (res.data ?? []).map((b) => normalizeBooking(kind, b as never)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function useBookings() {
    const [rows, setRows] = useState<RowsByKind>(emptyRows);
    const [errors, setErrors] = useState<ErrorsByKind>(emptyErrors);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        setLoading(true);
        const result = await Promise.allSettled(BOOKING_KINDS.map((k) => fetchRows(k)));
        const nextRows = emptyRows();
        const nextErrors = emptyErrors();
        result.forEach((r, i) => {
            const kind = BOOKING_KINDS[i];
            if (r.status === "fulfilled") nextRows[kind] = r.value;
            else nextErrors[kind] = getErrorMessage(r.reason, "Không tải được danh sách booking");
        })

        setRows(nextRows);
        setErrors(nextErrors);
        setLoading(false);
    }, [])

    useEffect(() => {
        reload();
    }, [reload])

    const cancel = useCallback(async (kind: BookingKind, id: string) => {
        const res = await cancelBooking(kind, id);
        if (!res.success) throw new Error(res.message || "Huỷ booking thất bại");
        try {
            const fresh = await fetchRows(kind);
            setRows((prev) => ({ ...prev, [kind]: fresh }));
        } catch {
            setRows((prev) => ({
                ...prev,
                [kind]: prev[kind].map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
            }));
        }
    }, [])

    return {rows, errors, loading, reload, cancel}
}

