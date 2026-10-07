import { useAuth } from "../context/AuthContext";
import { getDisplayName, getInitials } from "../utils/user";

export const NAV = [
  { label: 'Tổng quan', items: [{ key: 'dashboard', icon: '📊', text: 'Dashboard' }] },
  {
    label: 'Nội dung',
    items: [
      { key: 'tours', icon: '🗺️', text: 'Tour' },
      { key: 'hotels', icon: '🏨', text: 'Khách sạn' },
      { key: 'attractions', icon: '🎡', text: 'Điểm tham quan' },
      { key: 'destinations', icon: '📍', text: 'Điểm đến' },
    ],
  },
  {
    label: 'Vận hành',
    items: [
      { key: 'bookings', icon: '📋', text: 'Bookings', badge: 8 },
      { key: 'payments', icon: '💳', text: 'Thanh toán' },
      { key: 'reviews', icon: '⭐', text: 'Đánh giá' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { key: 'users', icon: '👥', text: 'Người dùng' },
      { key: 'notifications', icon: '🔔', text: 'Thông báo' },
    ],
  },
]

export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  tours: 'Quản lý Tour',
  hotels: 'Quản lý Khách sạn',
  attractions: 'Điểm tham quan',
  destinations: 'Điểm đến',
  bookings: 'Bookings',
  payments: 'Thanh toán',
  reviews: 'Đánh giá',
  users: 'Người dùng',
  notifications: 'Thông báo',
}

export type PageKey = keyof typeof PAGE_TITLES

type SidebarProps = {
  page: PageKey
  setPage: (page: PageKey) => void
  collapsed: boolean
  onClose: () => void // dùng cho mobile: đóng sidebar khi chọn menu / bấm nền mờ
}

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const

export default function Sidebar({ page, setPage, collapsed, onClose }: SidebarProps) {
  const { user } = useAuth()
  const displayName = getDisplayName(user)

  const handleSelect = (key: string) => {
    setPage(key as PageKey)
    if (window.innerWidth < 768) onClose()
  }

  return (
    <>
      <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
        <div className="sidebar-logo">
          <div className="logo-icon">✈️</div>
          <div className="logo-meta">
            <div className="logo-text">TravelApp</div>
            <div className="logo-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.label} style={{ display: 'contents' }}>
              <div className="nav-section-label">{group.label}</div>
              {group.items.map((item) => (
                <div
                  key={item.key}
                  title={collapsed ? item.text : undefined}
                  className={'nav-item' + (page === item.key ? ' active' : '')}
                  onClick={() => handleSelect(item.key)}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="nav-text">{item.text}</span>
                  {'badge' in item && item.badge ? (
                    <span className="nav-badge">{item.badge}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Thông tin lấy từ user đăng nhập (API login), không fix cứng */}
        <div className="sidebar-footer">
          <div className="user-info" title={collapsed ? displayName : undefined}>
            <div className="user-avatar">{getInitials(displayName)}</div>
            <div className="user-meta" style={{ minWidth: 0 }}>
              <div className="user-name" style={ellipsis}>{displayName}</div>
              <div className="user-role" style={ellipsis}>{user?.role || user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Nền mờ: chỉ hiện trên mobile khi sidebar đang mở */}
      {!collapsed && <div className="sidebar-backdrop" onClick={onClose} />}
    </>
  )
}