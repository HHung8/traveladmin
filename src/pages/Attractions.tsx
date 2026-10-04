import { useState } from "react"
import { useApp } from "../context/AppContext"

const ATTRACTIONS = [
    { id: 1, name: 'Hang Sửng Sốt', icon: '🕌', city: 'Vịnh Hạ Long', category: 'Hang động', lat: 20.8987, lng: 107.1012 },
    { id: 2, name: 'Bà Nà Hills', icon: '🎡', city: 'Đà Nẵng', category: 'Vui chơi', lat: 16.0285, lng: 107.9941 },
]

const SCHEDULES = [
    { id: 1, name: 'Bà Nà Hills', date: 'Thứ 7, 19/7/2025', time: '08:00 – 17:00', sold: 45, total: 100, price: 30 },
    { id: 2, name: 'Bà Nà Hills', date: 'Chủ nhật, 20/7/2025', time: '08:00 – 17:00', sold: 88, total: 100, price: 30 },
    { id: 3, name: 'Hang Sửng Sốt', date: 'Thứ 2 – Thứ 6 hàng tuần', time: '09:00 – 15:00', sold: 22, total: 50, price: 12 },
]

const CATEGORY_BADGE = {
    'Hang động': 'badge-blue',
    'Vui chơi': 'badge-purple',
}

export default function Attractions() {
    const [tab, setTab] = useState('list')
    const [q, setQ] = useState('')
    const { openModal, showToast } = useApp()

    const items = ATTRACTIONS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))

    return (
        <div className="page active">
            <div className="tab-bar">
                <button className={'tab-btn' + (tab === 'list' ? ' active' : '')} onClick={() => setTab('list')}>
                    Điểm tham quan
                </button>
                <button className={'tab-btn' + (tab === 'schedules' ? ' active' : '')} onClick={() => setTab('schedules')}>
                    Lịch tham quan
                </button>
            </div>

            {/* ===== TAB 1: Danh sách ===== */}
            {tab === 'list' && (
                <div>
                    <div className="section-head">
                        <div>
                            <div className="section-title">Điểm tham quan</div>
                            <div className="section-sub">Tổng {ATTRACTIONS.length} điểm</div>
                        </div>
                        <button className="btn btn-primary" onClick={() => openModal('modal-create-attraction')}>
                            ＋ Thêm điểm
                        </button>
                    </div>

                    <div className="table-wrap">
                        <div className="table-toolbar">
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Tìm điểm tham quan..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <select className="filter-select">
                                <option>Tất cả loại</option>
                                <option>Hang động</option>
                                <option>Văn hóa</option>
                                <option>Vui chơi</option>
                                <option>Thiên nhiên</option>
                            </select>
                            <select className="filter-select">
                                <option>Tất cả điểm đến</option>
                                <option>Hạ Long</option>
                                <option>Đà Nẵng</option>
                            </select>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Tên</th>
                                    <th>Điểm đến</th>
                                    <th>Loại</th>
                                    <th>Tọa độ</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((a) => (
                                    <tr key={a.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="td-img">{a.icon}</div>
                                                <div><div className="td-name">{a.name}</div></div>
                                            </div>
                                        </td>
                                        <td>{a.city}</td>
                                        <td><span className={'badge ' + (CATEGORY_BADGE[a.category] || 'badge-blue')}>{a.category}</span></td>
                                        <td style={{ fontSize: 12, color: 'var(--text3)' }}>{a.lat}, {a.lng}</td>
                                        <td>
                                            <div className="td-actions">
                                                <button className="btn btn-outline btn-sm">✏️</button>
                                                <button className="btn btn-success btn-sm" onClick={() => setTab('schedules')}>📅 Lịch</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => showToast('Đã xóa điểm tham quan', 'error')}>
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== TAB 2: Lịch tham quan ===== */}
            {tab === 'schedules' && (
                <div>
                    <div className="section-head">
                        <div>
                            <div className="section-title">Lịch tham quan</div>
                            <div className="section-sub">Giờ mở cửa và số vé theo ngày</div>
                        </div>
                        <button className="btn btn-primary" onClick={() => openModal('modal-create-attr-schedule')}>
                            ＋ Tạo lịch
                        </button>
                    </div>

                    <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
                        <select className="filter-select" style={{ minWidth: 200 }}>
                            {ATTRACTIONS.map((a) => <option key={a.id}>{a.name}</option>)}
                        </select>
                        <select className="filter-select">
                            <option>Tháng 7/2025</option>
                            <option>Tháng 8/2025</option>
                        </select>
                    </div>

                    <div className="schedule-grid">
                        {SCHEDULES.map((s) => {
                            const left = s.total - s.sold
                            const almostFull = left / s.total <= 0.2 // còn ≤ 20% vé thì báo đỏ
                            return (
                                <div className="schedule-card" key={s.id}>
                                    <div className="sch-title">{s.name}</div>
                                    <div className="sch-meta">
                                        <div className="sch-row"><span className="sch-icon">📅</span>{s.date}</div>
                                        <div className="sch-row"><span className="sch-icon">🕐</span>{s.time}</div>
                                        <div className="sch-row"><span className="sch-icon">🎫</span>{s.sold} / {s.total} vé đã bán</div>
                                    </div>
                                    <div className="sch-foot">
                                        <div>
                                            <div className="sch-price">${s.price}</div>
                                            <div className="sch-slots" style={almostFull ? { color: 'var(--red)' } : undefined}>
                                                {almostFull ? 'Sắp hết vé' : `${left} vé còn lại`}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button className="btn btn-outline btn-sm">✏️</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => showToast('Đã xóa lịch', 'error')}>🗑</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
