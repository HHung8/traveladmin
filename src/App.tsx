import { useState, type ComponentType } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar, { PAGE_TITLES, type PageKey } from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Modals from "./components/Modals";
import Toasts from "./components/Toasts";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Destinations from "./pages/Destinations";
import Tours from "./pages/Tours";
import Hotels from "./pages/Hotels";
import Attractions from "./pages/Attractions";
import Booking from "./pages/Booking";

// Trang dự phòng cho các mục menu chưa làm (Thanh toán, Đánh giá, Người dùng, Thông báo)
const ComingSoon = () => (
  <div className="page active" style={{ color: "var(--text3)" }}>
    Trang này sắp ra mắt...
  </div>
);

// Key phải trùng với key trong NAV / PAGE_TITLES của Sidebar.tsx
const PAGES: Partial<Record<PageKey, ComponentType>> = {
  dashboard: Dashboard,
  destinations: Destinations,
  tours: Tours,
  hotels: Hotels,
  attractions: Attractions,
  bookings: Booking,
  // Làm xong trang nào thì thêm vào đây, ví dụ:
  // payments: Payments,
  // reviews: Reviews,
  // users: User,
  // notifications: Notifications,
};

function AdminLayout() {
  const [page, setPage] = useState<keyof typeof PAGE_TITLES>("dashboard");
  const Page = PAGES[page] ?? ComingSoon;

  // Mobile mặc định đóng, desktop nhớ lựa chọn lần trước
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (window.innerWidth < 768) return true;
    return localStorage.getItem("sidebar-collapsed") === "1";
  });

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (window.innerWidth >= 768) {
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
    }
  };

  return (
    <>
      <Sidebar
        page={page}
        setPage={setPage}
        collapsed={collapsed}
        onClose={() => setCollapsed(true)}
      />
      <main className={"main" + (collapsed ? " collapsed" : "")}>
        <Topbar page={page} onToggleSidebar={toggleSidebar} />
        <div className="content">
          <Page />
        </div>
      </main>
      <Modals />
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<AdminLayout />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}