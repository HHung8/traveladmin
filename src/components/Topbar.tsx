import { PAGE_TITLES } from "./Sidebar";

type TopbarProps = {
  page: keyof typeof PAGE_TITLES;
};

export default function Topbar({ page }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">{PAGE_TITLES[page]}</div>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn" title="Thông báo">🔔</button>
        <button className="topbar-btn" title="Cài đặt">⚙️</button>
        <div className="user-info" style={{ padding: '4px 8px', borderRadius: 8, cursor: 'pointer' }}>
          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>AD</div>
        </div>
      </div>
    </header>
  )
}