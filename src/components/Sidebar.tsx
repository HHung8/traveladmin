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

type SidebarProps = {
  page: string
  setPage: (page: string) => void
}

export default function Sidebar({ page, setPage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">✈️</div>
        <div>
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
                className={'nav-item' + (page === item.key ? ' active' : '')}
                onClick={() => setPage(item.key)}
              >
                <span className="icon">{item.icon}</span>
                {item.text}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">AD</div>
          <div>
            <div className="user-name">Admin</div>
            <div className="user-role">Quản trị viên</div>
          </div>
        </div>
      </div>
    </aside>
  )
}