import { useCallback, useEffect, useState } from "react";
import { getBookings } from "../api/booking";
import { getUsers } from "../api/user";
import { getStatusMeta, KIND_META, normalizeBooking, type BookingRow } from "../utils/bookings";
import { getErrorMessage } from "../utils/error";

interface DashboardData {
  bookings: BookingRow[];
  userCount: number;
}

const formatMoney = (amount: number) => "$" + amount.toLocaleString("en-US");

const getDateRange = (days: number, referenceDate: Date) => {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return { start, end };
};

const isBetween = (date: Date, start: Date, end: Date) =>
  !Number.isNaN(date.getTime()) && date >= start && date <= end;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [toursResponse, hotelsResponse, attractionsResponse, usersResponse] = await Promise.all([
        getBookings("tours"),
        getBookings("hotels"),
        getBookings("attractions"),
        getUsers({ page: 1, pageSize: 1 }),
      ]);

      if (!toursResponse.success) throw new Error(toursResponse.message || "Không tải được booking tour");
      if (!hotelsResponse.success) throw new Error(hotelsResponse.message || "Không tải được booking khách sạn");
      if (!attractionsResponse.success) throw new Error(attractionsResponse.message || "Không tải được booking điểm tham quan");
      if (!usersResponse.success) throw new Error(usersResponse.message || "Không tải được số lượng người dùng");

      const bookings = [
        ...(toursResponse.data ?? []).map((booking) => normalizeBooking("tours", booking)),
        ...(hotelsResponse.data ?? []).map((booking) => normalizeBooking("hotels", booking)),
        ...(attractionsResponse.data ?? []).map((booking) => normalizeBooking("attractions", booking)),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNow(new Date());
      setData({ bookings, userCount: usersResponse.data.totalCount });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không tải được dữ liệu dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = new Date(nextMonthStart.getTime() - 1);
  const monthBookings = (data?.bookings ?? []).filter((booking) =>
    isBetween(new Date(booking.createdAt), monthStart, monthEnd)
  );
  const confirmedMonthBookings = monthBookings.filter((booking) => booking.status.toLowerCase() === "confirmed");
  const cancelledMonthBookings = monthBookings.filter((booking) => booking.status.toLowerCase() === "cancelled");
  const cancellationRate = monthBookings.length
    ? (cancelledMonthBookings.length / monthBookings.length) * 100
    : 0;
  const monthRevenue = confirmedMonthBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

  const { start: weekStart, end: weekEnd } = getDateRange(7, now);
  const weekBookings = (data?.bookings ?? []).filter((booking) =>
    booking.status.toLowerCase() === "confirmed" &&
    isBetween(new Date(booking.createdAt), weekStart, weekEnd)
  );
  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const amount = weekBookings
      .filter((booking) => isBetween(new Date(booking.createdAt), dayStart, dayEnd))
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    return {
      label: day.toLocaleDateString("vi-VN", { weekday: "short" }),
      date: day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      amount,
    };
  });
  const weekRevenue = revenueByDay.reduce((sum, day) => sum + day.amount, 0);
  const maxDailyRevenue = Math.max(...revenueByDay.map((day) => day.amount), 1);

  const stats = [
    { label: "Doanh thu tháng", value: formatMoney(monthRevenue), caption: `${confirmedMonthBookings.length} booking đã xác nhận`, icon: "💰", bg: "#EEF2FF" },
    { label: "Booking mới", value: String(monthBookings.length), caption: "Trong tháng này", icon: "📋", bg: "#E6F4EA" },
    { label: "Người dùng", value: (data?.userCount ?? 0).toLocaleString("vi-VN"), caption: "Tổng tài khoản", icon: "👥", bg: "#FEF3C7" },
    { label: "Tỷ lệ hủy", value: `${cancellationRate.toFixed(1)}%`, caption: `${cancelledMonthBookings.length} booking đã hủy trong tháng`, icon: "❌", bg: "#FEE2E2" },
  ];

  return (
    <div className="page active">
      {error && (
        <div className="chart-card" role="alert" style={{ marginBottom: 16, color: "var(--red)" }}>
          <div>{error}</div>
          <button className="btn btn-outline btn-sm" onClick={() => void reload()} disabled={loading} style={{ marginTop: 10 }}>
            Thử tải lại
          </button>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-icon" style={{ background: stat.bg }}>{stat.icon}</div>
            </div>
            <div className="stat-value">{loading && !data ? "Đang tải..." : stat.value}</div>
            <div className="stat-change">{stat.caption}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <div>
              <div className="section-title">Doanh thu 7 ngày</div>
              <div className="section-sub">Tổng: {formatMoney(weekRevenue)}</div>
            </div>
          </div>

          <div className="mini-chart">
            {revenueByDay.map((day) => (
              <div
                key={day.date}
                className="mini-bar"
                style={{ height: `${(day.amount / maxDailyRevenue) * 100}%` }}
                title={`${day.date}: ${formatMoney(day.amount)}`}
              />
            ))}
          </div>
          <div className="chart-labels">
            {revenueByDay.map((day) => (
              <div className="chart-label" key={day.date}>{day.label}</div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="section-title" style={{ marginBottom: 0 }}>Booking gần đây</div>
          <div className="recent-list">
            {(data?.bookings ?? []).slice(0, 4).map((booking) => {
              const status = getStatusMeta(booking.status);
              return (
                <div className="recent-item" key={`${booking.kind}-${booking.id}`}>
                  <div className="recent-icon" style={{ background: "#EEF2FF" }}>{KIND_META[booking.kind].icon}</div>
                  <div className="recent-info">
                    <div className="recent-name">{booking.title}</div>
                    <div className="recent-sub">
                      {KIND_META[booking.kind].label} · {booking.guests} khách · {booking.code}
                    </div>
                  </div>
                  <div>
                    <div className="recent-amount">{formatMoney(booking.totalPrice)}</div>
                    <span className={`badge ${status.badge}`} style={{ fontSize: 10 }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {!loading && !error && data?.bookings.length === 0 && (
              <div className="section-sub" style={{ padding: "20px 0" }}>Chưa có booking nào</div>
            )}
            {loading && !data && (
              <div className="section-sub" style={{ padding: "20px 0" }}>Đang tải booking...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
