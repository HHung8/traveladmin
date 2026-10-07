import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PAGE_TITLES } from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { getDisplayName, getInitials } from "../utils/user";

type TopbarProps = {
  page: keyof typeof PAGE_TITLES;
  onToggleSidebar: () => void;
};

export default function Topbar({ page, onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = getDisplayName(user);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout(); // gọi API logout rồi xóa token
    } finally {
      setLoggingOut(false);
      setOpen(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-btn"
          onClick={onToggleSidebar}
          title="Thu gọn / mở rộng menu"
        >
          ☰
        </button>
        <div className="page-title">{PAGE_TITLES[page]}</div>
      </div>

      <div className="topbar-right">
        <button className="topbar-btn" title="Thông báo">🔔</button>
        <button className="topbar-btn" title="Cài đặt">⚙️</button>

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray-100"
          >
            <span className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {getInitials(displayName)}
            </span>
            <span className="hidden max-w-[140px] truncate text-sm font-semibold text-gray-800 sm:block">
              {displayName}
            </span>
            <span className="text-[10px] text-gray-400">▼</span>
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
              style={{ top: "100%", zIndex: 100 }}
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {displayName}
                </div>
                {user?.email && (
                  <div className="truncate text-xs text-gray-500">{user.email}</div>
                )}
                {user?.role && (
                  <span className="mt-1.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                    {user.role}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>⏻</span>
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}